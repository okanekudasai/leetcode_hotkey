chrome.runtime.onInstalled.addListener(() => {
    let setObj = {};
    setObj['hot_key'] = 'ControlLeft+Space';
    chrome.storage.local.set(setObj);
    chrome.storage.local.set({basic_directory: "algorithm_auto_push_extension"});
});

//ControlLeft, ShiftLeft, AltLeft, Space

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'closeCurrentTab') {
        // 현재 탭 닫기
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (currentTab) {
                chrome.tabs.remove(currentTab.id);
            }
        });
        
        code = request.data;

        // aws를 통해 accesstoken을 받아와요
        let token = await fetch("http://localhost:9999/api/codeToToken/" + code).then(res => res.text());

        // accesstoken을 받아오는데 실패했다면 창을 닫고 모든 프로세스를 종료해요
        if (token == 'error') {
            return;
        }

        const headers = new Headers();
        headers.append('Authorization', `token ${token}`);
        fetch('https://api.github.com/user', {
            method: 'GET',
            headers: headers,
        }).then(res => res.json()).then(data => {
            chrome.storage.local.set({ "token": token });
            chrome.storage.local.set({ "username": JSON.stringify(data) });
            chrome.storage.local.set({ "solve_detect": true })
        })
    }
});

