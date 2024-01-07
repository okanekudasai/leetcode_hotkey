chrome.runtime.onInstalled.addListener(() => {
    let setObj = {};
    setObj['hot_key'] = 'ControlLeft+Space';
    chrome.storage.local.set(setObj);
});

//ControlLeft, ShiftLeft, AltLeft, Space

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'closeCurrentTab') {
        // 현재 탭 닫기
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (currentTab) {
                chrome.tabs.remove(currentTab.id);
            }
        });
    }
});