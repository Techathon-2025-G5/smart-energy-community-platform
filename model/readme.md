### Proyecto: **Playground de Gestión Energética para Comunidades Sostenibles**

---

#### Model

El modelo está construido utilizando la librería pymgrid de Python.

##### Reinforcement Learning (RL) Environments

Environment classes using the OpenAI Gym API for reinforcement learning.

###### Discrete
A discrete env that implements priority lists as actions on a microgrid.
The environment deploys fixed controllable modules to the extent necessary to zero out the net load (load minus renewable generation).

class pymgrid.envs.DiscreteMicrogridEnv(
    modules, 
    add_unbalanced_module=True, 
    loss_load_cost=10, 
    overgeneration_cost=2, 
    reward_shaping_func=None, 
    trajectory_func=None, 
    flat_spaces=True, 
    observation_keys=None, 
    remove_redundant_gensets=True, 
    step_callback=None, 
    reset_callback=None
)

###### Continuous

class pymgrid.envs.ContinuousMicrogridEnv(
    modules, 
    add_unbalanced_module=True, 
    loss_load_cost=10, 
    overgeneration_cost=2, 
    reward_shaping_func=None, 
    trajectory_func=None, 
    flat_spaces=True, 
    observation_keys=(), 
    step_callback=None, 
    reset_callback=None
)

##### Módulos

- Timeseries Modules: GridModule, LoadModule, RenewableModule
- Non-temporal Modules: BatteryModule, GensetModule
- Helper Module: UnbalancedEnergyModule

###### General parameters

**forecaster:** callable, float, “oracle”, or None, default None.
    Function that gives a forecast n-steps ahead.

    If callable, must take as arguments (val_c: float, val_{c+n}: float, n: int), where
        val_c is the current value in the time series: self.time_series[self.current_step]
        val_{c+n} is the value in the time series n steps in the future
        n is the number of steps in the future at which we are forecasting.

        The output forecast = forecaster(val_c, val_{c+n}, n) must have the same sign as the inputs val_c and val_{c+n}.

    If float, serves as a standard deviation for a mean-zero gaussian noise function that is added to the true value.
    If "oracle", gives a perfect forecast.
    If None, no forecast.

**forecast_horizon:** Int. Number of steps in the future to forecast. If forecaster is None, ignored and 0 is returned.
**forecaster_increase_uncertainty:** Bool. Whether to increase uncertainty for farther-out dates if using a GaussianNoiseForecaster. Ignored otherwise. 

Classes available to use for time-series forecasting, as well a class that allows users to define their own forecaster.

get_forecaster(forecaster, ...[, ...])          -> Get the forecasting function for the time series module.
OracleForecaster(observation_space, ...)        
GaussianNoiseForecaster(noise_std, ...[, ...])  -> Forecaster that adds Gaussian noise to true future values.
UserDefinedForecaster(forecaster_function, ...)
NoForecaster(observation_space, forecast_shape)


**Common Methods**

- as_fixed(): Convert the module to a fixed module.
- as_flex(): Convert the module to a flex module.
- as_sink(energy_excess): Act as an energy sink to the microgrid (action).
- as_source(energy_demand): Act as an energy source to the microgrid (action).
- dump([stream]): Save a module to a YAML buffer.
- load(stream): Load a module from yaml representation.
- log_dict(): Module's log as a dict.
- log_frame(): Module's log as a DataFrame.
- reset(): Reset the module to step zero and flush the log.
- sample_action([strict_bound]): Sample an action from the module's action space.
- state_dict([normalized]): Current state of the module as a dictionary.
- step(action[, normalized]): Take one step in the module, attempting to draw or send action amount of energy.

###### GridModule

An electrical grid module. By default, GridModule is a fixed module; it can be transformed to a flex module with GridModule.as_flex.

class pymgrid.modules.GridModule(
    max_import: float,                                          -> Maximum import at any time step.
    max_export: float,                                          -> Maximum export at any time step.
    time_series: list,                                          -> [[import_price: float, export_price: float, co2_per_kwH: float, grid_status: bool], ...]
    forecaster: callable, float, “oracle”, None = None,
    forecast_horizon: int = 23,                                 
    forecaster_increase_uncertainty: bool = False,              
    forecaster_relative_noise=False, 
    initial_step: int = 0, 
    final_step: int = -1, 
    cost_per_unit_co2: float = 0.0,                             -> Marginal cost of grid co2 production.
    normalized_action_bounds: tuple of int or float = (0, 1),   -> Bounds of normalized actions. Change to (-1, 1) for e.g. an RL policy with a Tanh output activation.
    raise_errors: bool = False                                  -> Whether to raise errors if bounds are exceeded in an action. If False, actions are clipped to the limit possible.
)

###### LoadModule

class pymgrid.modules.LoadModule(
    time_series: list,                      -> Time series of load demand. Shape: (n_steps, )
    forecaster=None, 
    forecast_horizon=23, 
    forecaster_increase_uncertainty=False, 
    forecaster_relative_noise=False, 
    initial_step=0, 
    final_step=-1, 
    normalized_action_bounds=(0, 1), 
    raise_errors=False
)

###### RenewableModule

class pymgrid.modules.RenewableModule(
    time_series,                            -> Time series of renewable production. Shape: (n_steps, )
    raise_errors=False, 
    forecaster=None, 
    forecast_horizon=23, 
    forecaster_increase_uncertainty=False, 
    forecaster_relative_noise=False, 
    initial_step=0, 
    final_step=-1, 
    normalized_action_bounds=(0, 1),        -> Bounds of normalized actions. Change to (-1, 1) for e.g. an RL policy with a Tanh output activation.
    provided_energy_name='renewable_used'   -> Name of the energy provided by this module, to be used in logging.
)

###### BatteryModule

A battery module. Battery modules are fixed: when calling Microgrid.run, you must pass a control for batteries.

class pymgrid.modules.BatteryModule(
    min_capacity: float,                -> Minimum energy that must be contained in the battery.
    max_capacity: float,                -> Maximum energy that can be contained in the battery. If soc=1, capacity is at this maximum.
    max_charge: float,                  -> Maximum amount the battery can be charged in one step.
    max_discharge: float,               -> Maximum amount the battery can be discharged in one step. 
    efficiency: float,                  -> Efficiency of the battery. See BatteryModule.model_transition() for details. 
    battery_cost_cycle: float = 0.0,    -> Marginal cost of charging and discharging. 
    battery_transition_model=None, 
    init_charge: float or None = None,  -> Initial charge of the battery. One of init_charge or init_soc must be passed, else an exception is raised. If both are passed, init_soc is ignored and init_charge is used.
    init_soc: float or None = None,     -> Initial state of charge of the battery. One of init_charge or init_soc must be passed, else an exception is raised. If both are passed, init_soc is ignored and init_charge is used.
    initial_step=0, 
    normalized_action_bounds=(0, 1),    -> Bounds of normalized actions. Change to (-1, 1) for e.g. an RL policy with a Tanh output activation.
    raise_errors=False
)

**battery_transition_model:** callable or None, default None.
Function to model the battery’s transition. If None, BatteryTransitionModel is used.

If you define a battery_transition_model, it must be YAML-serializable if you plan to serialize your battery module or any microgrid containing your battery. For example, you can define it as a class with a __call__ method and yaml.YAMLObject as its metaclass. See the PyYAML documentation for details and BatteryTransitionModel for an example.

###### GensetModule

A genset/generator module.

This module is a controllable source module; when used as a module in a microgrid, you must pass it an energy production request.

class pymgrid.modules.GensetModule(
    running_min_production: float,              -> Minimum production of the genset when it is running.
    running_max_production,                     -> Maximum production of the genset when it is running.
    genset_cost: float or callable,             -> If float, the marginal cost of running the genset: total_cost = genset_cost * production. If callable, a function that takes the genset production as an argument and returns the genset cost.
    co2_per_unit: float = 0.0,                  -> Carbon dioxide production per unit energy production.
    cost_per_unit_co2: float = 0.0,             -> Carbon dioxide cost per unit carbon dioxide production.
    start_up_time: int = 0,                     -> Number of steps it takes to turn on the genset.
    wind_down_time: int = 0,                    -> Number of steps it takes to turn off the genset.
    allow_abortion: bool = True,                -> Whether the genset is able to remain shut down while in the process of starting up and vice versa.
    init_start_up: bool = True,                 -> Whether the genset is running upon reset. 
    initial_step: int = 0, 
    normalized_action_bounds=(0, 1),            -> Bounds of normalized actions. Change to (-1, 1) for e.g. an RL policy with a Tanh output activation.
    raise_errors=False, 
    provided_energy_name='genset_production'    -> Name of the energy provided by this module, to be used in logging.
)

###### UnbalancedEnergyModule

class pymgrid.modules.UnbalancedEnergyModule(
    raise_errors, 
    initial_step=0, 
    loss_load_cost=10, 
    overgeneration_cost=2.0, 
    normalized_action_bounds=(0, 1)
)

##### Control

**Rule Based Control:** Heuristic Algorithm that deploys modules via a priority list.
In rule-based control, modules are deployed in a preset order. You can either define this order by passing a priority list or the order will be defined automatically from the module with the lowest marginal cost to the highest.

class pymgrid.algos.RuleBasedControl(
    microgrid,                          -> Microgrid on which to run rule-based control.
    priority_list: list or None = None, -> Priority list to use. If None, the order will be defined automatically from the module with the lowest marginal cost to the highest.
    remove_redundant_gensets=True
)

- Methods:
  - get_action(): Given the priority list, define an action.
  - get_priority_lists(remove_redundant_gensets): Get all of the priority lists for the microgrid.
  - reset(): Reset the underlying microgrid.
  - run([max_steps, verbose]): Get the priority list and then deploy on the microgrid for some number of steps.
- Attributes
  - priority_list: Order in which to deploy controllable modules.
  - microgrid: Microgrid on which to run rule-based control.


