import { useEffect, useRef } from 'react'

function ContentBox({
    value,
    onChange,
    placeholder,
    onSubmit,
    border = '1px solid var(--border, #ddd)',
    fontSize = 16,
    minHeight = 20,
    maxHeight = 250,
    enterToSubmit = false
}) {
    const ref = useRef(null)

    // Keep DOM in sync when `value` changes programmatically
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const text = el.innerText.replace(/\u00A0/g, ' ')
        if (text !== value) {
            el.textContent = value || ''
        }
    }, [value])

    function emit() {
        const el = ref.current
        if (!el) return
        const text = el.innerText.replace(/\u00A0/g, ' ')
        onChange?.(text)
    }

    function onInput() {
        emit()
    }

    function onPaste(e) {
        e.preventDefault()
        const text = (e.clipboardData || window.clipboardData).getData('text')
        document.execCommand('insertText', false, text)
    }

    function onKeyDown(e) {
        if (enterToSubmit) {
            // Enter → submit, Ctrl+Enter → new line
            if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                onSubmit?.()
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                // Insert line break at caret position
                document.execCommand('insertLineBreak')
            }
        } else {
            // Default behavior: Ctrl+Enter = submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                onSubmit?.()
            }
        }
    }

    return (
        <div
            ref={ref}
            contentEditable
            role="textbox"
            aria-multiline="true"
            onInput={onInput}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            data-placeholder={placeholder || ''}
            style={{
                minHeight: minHeight,
                maxHeight: maxHeight,
                overflowY: 'auto',
                padding: '8px 10px',
                border: border,
                borderRadius: 8,
                background: 'var(--card, #fff)',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: fontSize
            }}
            className="w-full ce-input"
            suppressContentEditableWarning
        />
    )
}

export default ContentBox;
