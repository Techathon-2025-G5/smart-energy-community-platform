from __future__ import annotations

from typing import Any

from model.envs import ContinuousMicrogridEnv
from model.rec_model import microgrid
from stable_baselines3 import PPO, A2C, DQN, SAC


class RLController:
    """Controller based on stable-baselines3 reinforcement learning algorithms."""

    def __init__(self) -> None:
        self.env: ContinuousMicrogridEnv | None = None
        self.model: Any | None = None
        self.obs: Any | None = None
        self.train: bool = False

    def setup(
        self,
        algorithm: str = "ppo",
        train: bool = False,
        model_path: str | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialise the RL agent and wrap the current microgrid."""
        if microgrid.microgrid is None:
            raise RuntimeError("Microgrid is not initialized")

        modules = microgrid.microgrid.modules.to_list()
        self.env = ContinuousMicrogridEnv(modules)
        # disable verbose logging that depends on gym's logger
        self.env._microgrid_logger.log = lambda *a, **k: None

        algo_name = algorithm.lower()
        algo_map = {
            "ppo": PPO,
            "a2c": A2C,
            "dqn": DQN,
            "sac": SAC,
        }
        if algo_name not in algo_map:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        algo_cls = algo_map[algo_name]

        if model_path:
            self.model = algo_cls.load(model_path, env=self.env, **kwargs)
        else:
            self.model = algo_cls("MlpPolicy", self.env, **kwargs)

        self.train = train
        self.obs = self.env.reset()

    def get_config(self) -> list:
        return []

    def step(self) -> dict[str, Any]:
        if not self.model or not self.env:
            raise RuntimeError("Controller not initialized")

        action, _ = self.model.predict(self.obs)
        obs, reward, done, info = self.env.step(action)
        self.obs = obs

        if self.train:
            self.model.learn(total_timesteps=1, reset_num_timesteps=False)

        return {
            "action": action,
            "observation": obs,
            "reward": reward,
            "done": done,
            "info": info,
        }

    def reset(self) -> None:
        if self.env:
            self.obs = self.env.reset()
