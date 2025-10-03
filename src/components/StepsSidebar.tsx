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
      <div className="hidden md:block w-48 bg-card border-r border-border p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-6">Progression</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center mr-4">
                {/* Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${step.number === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.completed
                      ? 'bg-primary/90 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {step.completed ? '✓' : step.number}
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      step.completed ? 'bg-primary/90' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <div
                className={`text-sm ${
                  step.number === currentStep
                    ? 'text-primary font-semibold'
                    : step.completed
                    ? 'text-primary/80'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Progress - Horizontal */}
      <div className="md:hidden bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  ${step.number === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.completed
                    ? 'bg-primary/90 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {step.completed ? '✓' : step.number}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step.completed ? 'bg-primary/90' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current step label on mobile */}
        <div className="mt-3 text-center text-sm font-medium text-foreground">
          {steps[currentStep - 1]?.label}
        </div>
      </div>
    </>
  );
}
