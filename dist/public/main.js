'use strict'; {
    const HFS = window.HFS;

    // We use capture=true to intercept the event before HFS's internal handlers
    window.addEventListener('click', onClick, true);

    function onClick(event) {
        // 1. Must be in Select Mode
        if (!HFS.state.showFilter) return;

        // 2. Identify the clicked entry
        const target = event.target;
        let entry = HFS.elementToEntry(target);

        // Fallback for special characters
        if (!entry) {
            const li = target instanceof HTMLElement ? target.closest('li') : null;
            if (li) {
                const a = li.querySelector('.link-wrapper a');
                if (a && a.href) {
                    try {
                        const path = new URL(a.href).pathname;
                        const decoded = decodeURIComponent(path);
                        const list = HFS.state.list || [];
                        entry = list.find(e => {
                            try { return decodeURIComponent(e.uri) === decoded; } catch { return false; }
                        });
                    } catch (e) { }
                }
            }
        }

        if (!entry) return;

        // 3. Identify WHAT was clicked
        let isIcon = false;

        let el = target;
        while (el && el !== document.body && !el.classList.contains('entry') && !el.tagName.match(/LI/i)) {
            if (el.classList.contains('entry-name')) {
                return; // Not icon click
            }

            if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
            if (el.classList.contains('MuiCheckbox-root')) return;
            if (el.closest('.entry-panel')) return;

            if (el.tagName === 'IMG' || el.tagName === 'SVG' || el.classList.contains('icon')) {
                isIcon = true;
            }

            el = el.parentElement;
        }

        if (!isIcon && target.closest('.entry-name')) {
            return;
        }
        if (!isIcon && target.closest('.file-menu-button')) {
            return;
        }
        if (!isIcon && !target.closest('.entry-name')) {
            isIcon = true;
        }

        if (isIcon) {
            const isSelected = HFS.state.selected[entry.uri];
            if (isSelected) {
                delete HFS.state.selected[entry.uri];
            } else {
                HFS.state.selected[entry.uri] = true;
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    // =========================
    // Auto Exit Select Mode
    // =========================

    let pendingAction = null; // 'delete'

    // 监听 Cut 按钮点击
    document.addEventListener('click', function(e) {
        if (!HFS.state.showFilter) return;

        const target = e.target;
        const cutButton = target.closest('#cut-button');
        
        if (cutButton) {
            const selectedCount = Object.keys(HFS.state.selected || {}).length;
            
            if (selectedCount > 0) {
                // Cut 没有确认对话框，直接延迟退出
                setTimeout(() => {
                    if (HFS.state.selected) {
                        for (const k in HFS.state.selected) {
                            delete HFS.state.selected[k];
                        }
                    }
                    HFS.state.showFilter = false;
                }, 300);
            }
        }
    }, true);

    // 监听 Delete 按钮点击
    document.addEventListener('click', function(e) {
        if (!HFS.state.showFilter) return;

        const target = e.target;
        const deleteButton = target.closest('#delete-button');
        
        if (deleteButton) {
            const selectedCount = Object.keys(HFS.state.selected || {}).length;
            
            if (selectedCount > 0) {
                // 标记为待处理的删除操作，等待确认
                pendingAction = 'delete';
            }
        }
    }, true);

    // 监听对话框中的确认按钮（Yes 按钮）
    document.addEventListener('click', function(e) {
        if (!HFS.state.showFilter) return;
        if (pendingAction !== 'delete') return;

        const target = e.target;
        
        // 检查是否点击了对话框中的 "Yes" 按钮
        const dialog = target.closest('.dialog');
        if (dialog) {
            const button = target.closest('button');
            if (button && button.textContent.trim() === 'Yes') {
                pendingAction = null;
                
                // 延迟退出，确保 HFS 先处理删除
                setTimeout(() => {
                    if (HFS.state.selected) {
                        for (const k in HFS.state.selected) {
                            delete HFS.state.selected[k];
                        }
                    }
                    HFS.state.showFilter = false;
                }, 300);
            } else if (button && button.textContent.trim() === "Don't") {
                // 用户取消了删除
                pendingAction = null;
            }
        }
    }, true);

    // 监听对话框关闭按钮
    document.addEventListener('click', function(e) {
        if (!HFS.state.showFilter) return;
        if (pendingAction !== 'delete') return;

        const target = e.target;
        const closeButton = target.closest('.dialog-closer');
        
        if (closeButton) {
            pendingAction = null;
        }
    }, true);
}