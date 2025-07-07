"""Controllers for microgrid operation."""

from .rule_based import RuleBasedController

# Singleton instance of the rule based controller
rule_controller = RuleBasedController()
