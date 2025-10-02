'use client';

interface Step {
  number: number;
  label: string;
  completed: boolean;
}

interface StepsSidebarProps {
  steps: Step[];
  currentStep: number;
}

export default function StepsSidebar({ steps, currentStep }: StepsSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - Vertical */}
      <div className="hidden md:block w-48 bg-white border-r border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-6">Progression</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center mr-4">
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${step.number === currentStep
                      ? 'bg-fleetzen-teal text-white'
                      : step.completed
                      ? 'bg-fleetzen-teal-dark text-white'
                      : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {step.completed ? '✓' : step.number}
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      step.completed ? 'bg-fleetzen-teal-dark' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <div
                className={`text-sm ${
                  step.number === currentStep
                    ? 'text-fleetzen-teal font-semibold'
                    : step.completed
                    ? 'text-fleetzen-teal-dark'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Progress - Horizontal */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  ${step.number === currentStep
                    ? 'bg-fleetzen-teal text-white'
                    : step.completed
                    ? 'bg-fleetzen-teal-dark text-white'
                    : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {step.completed ? '✓' : step.number}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step.completed ? 'bg-fleetzen-teal-dark' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current step label on mobile */}
        <div className="mt-3 text-center text-sm font-medium text-gray-700">
          {steps[currentStep - 1]?.label}
        </div>
      </div>
    </>
  );
}
