import constant from '../../lib/constant';

const ReactionsModal = ({ rxnItems, setRxnOpen, }) => {
    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setRxnOpen(false)}
        >
            <div
                className="bg-[--panel]  rounded-2xl shadow-2xl w-[90%] max-w-md max-h-[80vh] overflow-y-auto p-5 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-base font-semibold text-[var(--fg)] ">
                        Reactions
                    </h4>
                    <button
                        className="font-extrabold text-[var(--fg)] hover:text-red-500 transition-colors"
                        onClick={() => setRxnOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="mt-4 space-y-3">
                    {rxnItems.map((r, i) => {
                        return (
                            <div
                                key={i}
                                className="flex items-center justify-between bg-[var(--bg)]  px-4 py-2 rounded-lg hover:bg-[var(--hover-bg)]  transition-colors"
                            >
                                <span className="text-sm text-[var(--fg)] ">
                                    @{r.user}
                                </span>
                                <b className="text-base">{constant.reactions[r.type]}</b>
                            </div>
                        )
                    })}

                    {!rxnItems.length && (
                        <div className="text-center text-sm text-gray-500 py-6">
                            No reactions yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReactionsModal;