import numpy as np
import pandas as pd
import warnings

from collections import OrderedDict
from gym import Env
from gym.spaces import Box, Dict, Tuple, flatten_space, flatten
from abc import abstractmethod

from pymgrid import Microgrid
from model.utils.space import MicrogridSpace
from model.utils.logger import ModularLogger

class BaseMicrogridEnv(Microgrid, Env):
    """
    Base class for all microgrid environments.

    Implements the `OpenAI Gym API <https://www.gymlibrary.dev//>`_ for a microgrid;
    inherits from both :class:`.Microgrid` and :class:`gym.Env`.

    Parameters
    ----------
    modules : list, Microgrid, or int.
        The constructor can be called passing a list of microgrid modules. This is identical to the :class:`.Microgrid` constructor.

    add_unbalanced_module : bool, default True.
        Whether to add an unbalanced energy module to your microgrid. Such a module computes and attributes
        costs to any excess supply or demand.
        Set to True unless ``modules`` contains an :class:`.UnbalancedEnergyModule`.

    loss_load_cost : float, default 10.0
        Cost per unit of unmet demand. Ignored if ``add_unbalanced_module=False``.

    overgeneration_cost : float, default 2.0
        Cost per unit of excess generation.  Ignored if ``add_unbalanced_module=False``.

    flat_spaces : bool, default True
        Whether the environment's spaces should be flat.

        If True, all continuous spaces are :class:`gym:gym.spaces.Box`.

        Otherwise, they are nested :class:`gym:gym.spaces.Dict` of :class:`gym:gym.spaces.Tuple`
        of :class:`gym:gym.spaces.Box`, corresponding to the structure of the ``control`` arg of :meth:`.Microgrid.run`.

    trajectory_func : callable or None, default None
        Callable that sets an initial and final step for an episode. ``trajectory_func`` must take two inputs:
        :attr:`.initial_step` and :attr:`.final_step`, and return two integers: the initial and final step for
        that particular episode, respectively. This function will be called every time :meth:`.reset` is called.

        If None, :attr:`.initial_step` and :attr:`.final_step` are used to define every episode.

    step_callback: callable or None, default None
        Function to call on every ``step``.

    reset_callback: callable or None, default None
        Function to call on every ``reset``.

    """

    action_space = None
    'Space object corresponding to valid actions.'

    observation_space = None
    'Space object corresponding to valid observations.'

    def __init__(self,
                 modules,
                 add_unbalanced_module=True,
                 loss_load_cost=10,
                 overgeneration_cost=2,
                 flat_spaces=True,
                 observation_keys=(),
                 step_callback=None,
                 reset_callback=None
                 ):

        super().__init__(modules,
                         add_unbalanced_module=add_unbalanced_module,
                         loss_load_cost=loss_load_cost,
                         overgeneration_cost=overgeneration_cost)


        self._flat_spaces = flat_spaces
        self.observation_keys = self._validate_observation_keys(observation_keys)
        self.step_callback = step_callback if step_callback is not None else lambda *a, **k: None
        self.reset_callback = reset_callback if reset_callback is not None else lambda *a, **k: None

        # Build DataFrame of module spaces for MicrogridSpace construction
        self._spaces_df = self._build_space_dataframe()
        self.microgrid_action_space = MicrogridSpace.from_module_spaces(self._spaces_df, 'act')
        self.microgrid_observation_space = MicrogridSpace.from_module_spaces(self._spaces_df, 'obs')

        self.action_space = self._get_action_space()
        self.observation_space, self._nested_observation_space = self._get_observation_space()

        self._balance_logger = ModularLogger()
        self._microgrid_logger = ModularLogger()  # log additional information.

    def _build_space_dataframe(self):
        rows = []

        def convert_ms(ms):
            from model.utils.space import ModuleSpace as LocalModuleSpace
            return LocalModuleSpace(
                ms.unnormalized.low,
                ms.unnormalized.high,
                normalized_bounds=(ms.normalized.low, ms.normalized.high),
                clip_vals=getattr(ms, 'clip_vals', True),
                shape=ms.unnormalized.shape,
                dtype=ms.unnormalized.dtype,
            )

        for name, module_list in self.modules.iterdict():
            for num, module in enumerate(module_list):
                rows.append({
                    'module_name': name,
                    'module_number': num,
                    'action_space': convert_ms(module.action_space),
                    'observation_space': convert_ms(module.observation_space),
                    'module_type': module.module_type,
                })

        df = pd.DataFrame(rows).set_index(['module_name', 'module_number'])
        return df

    def _validate_observation_keys(self, keys):
        if not keys:
            return keys

        if isinstance(keys, str):
            keys = [keys]

        keys = np.array(keys)

        possible_keys = self.potential_observation_keys()
        bad_keys = [key for key in keys if key not in possible_keys]

        if bad_keys:
            raise NameError(f'Keys {bad_keys} not found in state.')

        # Put net load at the beginning, to match where it will be in the action space
        net_load_pos = np.where(np.array(keys) == 'net_load')[0]

        if net_load_pos.size:
            keys[[0, net_load_pos.item()]] = keys[[net_load_pos.item(), 0]]

        unique_keys, dupe_keys = [], []

        for k in keys:
            if k in unique_keys:
                dupe_keys.append(k)
                continue

            unique_keys.append(k)

        if dupe_keys:
            warnings.warn(f'Found duplicated keys, will be dropped:\n\t{dupe_keys}')

        return unique_keys

    @abstractmethod
    def _get_action_space(self, remove_redundant_actions=False):
        pass

    def _get_observation_space(self):
        obs_space = {}

        state_series = self.state_series

        if self.observation_keys is None or len(self.observation_keys) == 0:
            observation_keys = state_series.index.get_level_values(-1)
        else:
            observation_keys = pd.Index(self.observation_keys)

        observation_keys = observation_keys.drop_duplicates()

        if 'net_load' in observation_keys:
            obs_space['general'] = Tuple([Box(low=-np.inf, high=1, shape=(1, ), dtype=np.float64)])

        for name, module_list in self.modules.iterdict():
            tup = []
            for module_num, module in enumerate(module_list):
                normalized_space = module.observation_space['normalized']

                try:
                    relevant_state_idx = state_series.loc[pd.IndexSlice[name, module_num]].index
                except KeyError:
                    continue

                locs = [
                    relevant_state_idx.get_loc(key) for key in observation_keys if key in relevant_state_idx
                ]
                if locs:
                    box_slice = Box(
                        normalized_space.low[locs],
                        normalized_space.high[locs],
                        shape=(len(locs), ),
                        dtype=normalized_space.dtype
                    )

                    tup.append(box_slice)
            if tup:
                obs_space[name] = Tuple(tup)

        # Prevent sorting of keys; first cast to OrderedDict
        obs_space = Dict(OrderedDict(obs_space))

        return (flatten_space(obs_space) if self._flat_spaces else obs_space), obs_space

    def potential_observation_keys(self):
        return self.state_series.index.get_level_values(-1).unique()

    def reset(self):
        super().reset()
        self.reset_callback()
        return self._get_obs()

    def step(self, action, normalized=True):
        """
        Run one timestep of the environment's dynamics.

        When the end of the episode is reached, you are responsible for calling `reset()`
        to reset the environment's state.

        Accepts an action and returns a tuple (observation, reward, done, info).

        Parameters
        ----------
        action : int or np.ndarray
            An action provided by the agent.

        normalized : bool, default True
            Whether the passed action is normalized or not.

        Returns
        -------
        observation : dict[str, list[float]] or np.ndarray, shape self.observation_space.shape
            Observations of each module after using the passed ``action``.
            ``observation`` is a nested dict if :attr:`~.flat_spaces` is True and a one-dimensional numpy array
            otherwise.

        reward : float
            Reward/cost of running the microgrid. A positive value implies revenue while a negative
            value is a cost.

        done : bool
            Whether the microgrid terminates.

        info : dict
            Additional information from this step.

        """
        self._microgrid_logger.log(net_load=self.compute_net_load())

        action = self.convert_action(action)
        self._log_action(action, normalized)

        obs, reward, done, info = super().run(action, normalized=normalized)
        obs = self._get_obs()

        self.step_callback(**self._get_step_callback_info(action, obs, reward, done, info))

        return obs, reward, done, info

    @abstractmethod
    def convert_action(self, action):
        """
        Convert a reinforcement learning action to a microgrid control.

        In a discrete environment, for example, converts an integer to a microgrid control.

        Parameters
        ----------
        action : int, np.ndarray or dict
            Action to convert. Integer if discrete, np.ndarray if continuous,
            dict if converting from a microgrid action.

        Returns
        -------
        converted_action : dict[str, list[float]]
            Resultant microgrid control.
        """
        pass

    def _log_action(self, action, normalized, log_column='converted_action'):
        d = {}

        log_items = [(log_column, action)]

        if normalized:
            log_items.append((f'denormalized_{log_column}', self.microgrid_action_space.denormalize(action)))

        for key, action in log_items:
            for module, action_list in action.items():
                for j, act in enumerate(action_list):
                    if not pd.api.types.is_list_like(act):
                        act = [act]
                    d.update({(key, j, f'{module}_{el_num}'): act_n for el_num, act_n in enumerate(act)})

        self._microgrid_logger.log(d)

    def _get_obs(self):
        if self.observation_keys:
            obs = self.state_series.loc[pd.IndexSlice[:, :, self.observation_keys]]

            if self._flat_spaces:
                obs = obs.values
            else:
                obs = obs.to_frame().unstack(level=1).T.droplevel(level=1, axis=1).to_dict(orient='list')

        elif self._flat_spaces:
            obs = self.state_series.values
        else:
            obs = self.env_state_dict(normalized=True, as_run_output=True)

        return obs

    def _get_step_callback_info(self, action, obs, reward, done, info):
        return {
            'action': action,
            'obs': obs,
            'reward': reward,
            'done': done,
            'info': info
        }

    def compute_net_load(self, normalized=False):
        """
        Compute the net load at the current step.

        Net load is load minus renewables.
        -------

        Returns
        -------
        net_load : float
            Net load.

        """

        try:
            fixed_modules = list(self.modules.fixed.iterlist())
            fixed_consumption = sum(getattr(m, 'max_consumption', 0.0) for m in fixed_modules)
        except IndexError:
            assert self.current_step == self.final_step
            return 0.0
        except Exception:
            fixed_consumption = 0.0

        try:
            flex_modules = list(self.modules.flex.iterlist())
            flex_max_prod = [m.max_production for m in flex_modules if getattr(m, 'marginal_cost', None) == 0]
        except IndexError:
            assert self.current_step == self.final_step
            return 0.0
        except Exception:
            flex_max_prod = []

        flex_production = sum(flex_max_prod)

        net_load = fixed_consumption - flex_production

        if normalized:
            if fixed_consumption:
                return net_load / fixed_consumption
            return -1.0

        return net_load

    def render(self, mode="human"):
        """:meta private:"""
        raise RuntimeError('rendering is not possible in Microgrid environments.')

    def sample_action(self, strict_bound=False, sample_flex_modules=False):
        return self.action_space.sample()

    def env_state_dict(self, normalized=False, as_run_output=False, _initial=None):
        net_load = self.compute_net_load(normalized=normalized)

        if as_run_output:
            net_load_entry = np.array([net_load])
        else:
            net_load_entry = {'net_load': net_load}

        state_dict = {'general': [net_load_entry]}
        base_dict = super().state_dict
        if _initial is not None:
            base_dict = {**_initial, **base_dict}
        return {**state_dict, **base_dict}

    @staticmethod
    def flatten_obs(observation_space, obs):
        return np.concatenate([flatten(space, obs[k]) for k, space in observation_space.items()])

    @property
    def unwrapped(self):
        """:meta private:"""
        return super().unwrapped

    @property
    def flat_spaces(self):
        """
        Whether the environment's spaces are flat.

        If True, all continuous spaces are :class:`gym:gym.spaces.Box`.

        Otherwise, they are nested :class:`gym:gym.spaces.Dict` of :class:`gym:gym.spaces.Tuple`
        of :class:`gym:gym.spaces.Box`, corresponding to the structure of the ``control`` arg of :meth:`Microgrid.run`.

        Returns
        -------
        flat_spaces : bool
            Whether the environment's spaces are flat.

        """
        return self._flat_spaces