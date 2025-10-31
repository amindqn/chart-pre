import type { ChartDisplayOptions, DomainSettings, GraphedFunction } from "../../types/plot";
import { Panel } from "../common/Panel";
import { FunctionCard } from "./FunctionCard";
import { DomainControls } from "./DomainControls";
import { ChartOptions } from "./ChartOptions";

interface FunctionControlPanelProps {
    functions: GraphedFunction[];
    activeFunctionId: string;
    onActiveFunctionChange: (id: string) => void;
    onFunctionChange: (id: string, patch: Partial<GraphedFunction>) => void;
    onFunctionRemove: (id: string) => void;
    onAddFunction: () => void;
    domain: DomainSettings;
    options: ChartDisplayOptions;
    onDomainChange: (patch: Partial<DomainSettings>) => void;
    onOptionsChange: (patch: Partial<ChartDisplayOptions>) => void;
}

const MAX_FUNCTIONS = 6;

export const FunctionControlPanel = ({
    functions,
    activeFunctionId,
    onActiveFunctionChange,
    onFunctionChange,
    onFunctionRemove,
    onAddFunction,
    domain,
    options,
    onDomainChange,
    onOptionsChange,
}: FunctionControlPanelProps) => {
    const canAddMore = functions.length < MAX_FUNCTIONS;

    return (
        <div className="space-y-4">
            <Panel
                title="Functions"
                actions={
                    <button
                        type="button"
                        onClick={onAddFunction}
                        disabled={!canAddMore}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        Add function
                    </button>
                }
            >
                <div className="space-y-3 grid gap-5 lg:grid-cols-2">
                    {functions.map((fn) => (
                        <FunctionCard
                            key={fn.id}
                            fn={fn}
                            isActive={fn.id === activeFunctionId}
                            disableRemove={functions.length === 0}
                            onActivate={() => onActiveFunctionChange(fn.id)}
                            onChange={onFunctionChange}
                            onRemove={onFunctionRemove}
                        />
                    ))}
                    {!canAddMore && <p className="text-xs text-slate-500">You can plot up to {MAX_FUNCTIONS} functions at once.</p>}
                </div>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
                <Panel title="Domain & sampling">
                    <DomainControls
                        domain={domain}
                        onChange={onDomainChange}
                    />
                </Panel>

                <Panel title="Chart options">
                    <ChartOptions
                        options={options}
                        onChange={onOptionsChange}
                    />
                </Panel>
            </div>
        </div>
    );
};
