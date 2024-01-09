chrome.runtime.onInstalled.addListener(() => {
    let setObj = {};
    setObj['hot_key'] = 'ControlLeft+Space';
    chrome.storage.local.set(setObj);
    chrome.storage.local.set({basic_directory: "algorithm_auto_push_extension"});
    chrome.storage.local.remove("repo_pending")
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
        let token = await fetch("http://52.55.103.159:9999/api/codeToToken/" + code).then(res => res.text());

        // accesstoken을 받아오는데 실패했다면 창을 닫고 모든 프로세스를 종료해요
        if (token == 'error') {
            chrome.storage.local.remove("try_login");
            const channel = new BroadcastChannel('end_try_login');
            channel.postMessage(false);
            channel.close();
            return;
        }

        const headers = new Headers();
        headers.append('Authorization', `token ${token}`);
        fetch('https://api.github.com/user', {
            method: 'GET',
            headers: headers,
        }).then(res => res.json()).then(data => {
            chrome.storage.local.remove("try_login");
            chrome.storage.local.set({ "token": token });
            chrome.storage.local.set({ "username": JSON.stringify(data) });
            chrome.storage.local.set({ "solve_detect": true })
            const channel = new BroadcastChannel('end_try_login');
            channel.postMessage(true);
            channel.close();
        })
    }

    else if (request.action === 'canPendingClose') {
        let token = request.data;
        let basic_directory = request.basic_directory;
        let timer_id = request.timer_id;
        let cycle = 120;
        let check_new_repository = setInterval(async() => {
            let username = await new Promise((resolve, reject) => {
                const headers = new Headers();
                headers.append('Authorization', `token ${token}`);
                fetch('https://api.github.com/user', {
                    method: 'GET',
                    headers: headers,
                }).then(res => {
                    resolve(res.json());
                })
            });

            // repos_url에 있는 레포지터리 리스트를 받아와요
            let repo_list = await fetch(username["repos_url"], {
                method: 'GET',
            }).then(res => res.json())

            // repo_list를 돌며 basic_directory와 이름이 같은 리포지터리가 있는지 확인해요
            flag = false // 일단 레포지토리를 찾지 못한상태
            for (let i of repo_list) {
                if (i["name"] == basic_directory) {
                    flag = true; // 이미 해당리포지토리가 있으면 레포지토리 만들기 버튼을 숨겨요
                    break;
                }
            }

            console.log(cycle)
            // 팝업이 켜져 있다면 그 팝업에게 얘기하자
            if (flag) {
                chrome.storage.local.remove("start_time");
                const channel = new BroadcastChannel('repo_notice');
                chrome.storage.local.remove("repo_pending");
                clearInterval(check_new_repository);

                channel.postMessage({"result":true, "timer_id": timer_id});
                channel.close();
            }
            if (cycle-- <= 0) {
                chrome.storage.local.remove("start_time");
                const channel = new BroadcastChannel('repo_notice');
                chrome.storage.local.remove("repo_pending");
                clearInterval(check_new_repository);
                
                channel.postMessage({"result":false, "timer_id": timer_id});
                channel.close();
            }
        }, 2000)
    }
});

