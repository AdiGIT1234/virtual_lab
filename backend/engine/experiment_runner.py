class ExperimentRunner:
    def __init__(self, experiment, validator):
        self.experiment = experiment
        self.validator = validator

    def run(self):
        results = {}
        passed = True
        feedback = []

        # Check pin modes
        for pin, mode in self.experiment.get("requirements", {}).get("pin_modes", {}).items():
            if not self.validator.pin_is_output(pin):
                passed = False
                feedback.append(f"Pin {pin} is not set as OUTPUT.")
                results[f"pin_{pin}_output"] = False
            else:
                results[f"pin_{pin}_output"] = True

        # Check LED state
        if self.experiment.get("checks", {}).get("led_on"):
            if not self.validator.led_is_on():
                passed = False
                feedback.append("LED is not ON.")
                results["led_on"] = False
            else:
                results["led_on"] = True

        return {
            "passed": passed,
            "results": results,
            "feedback": feedback
        }
