let aws_server = "http://52.55.103.159:9999/api";

chrome.runtime.onInstalled.addListener(() => {
    let setObj = {};
    setObj['hot_key'] = 'ControlLeft+Space';
    chrome.storage.local.set(setObj);
    chrome.storage.local.set({basic_directory: "algorithm_auto_push_extension"});
    chrome.storage.local.remove("repo_pending")
});

let make_notify = (s) => {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/images/icon-128.png',
        title: '솔브 커밋',
        message: s
    });
}

const channel_for_display_hotkey = new BroadcastChannel('display_hot_key_box');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request['need_hot_key']) {
        channel_for_display_hotkey.onmessage = (event) => {
            clearInterval(event.data.hotkey_interval_id);
        }
        let hotkey_interval_id = setInterval(() => {
            channel_for_display_hotkey.postMessage({ hotkey_interval_id: hotkey_interval_id });
        },100)
    } else if (request['git_fail']) {
        make_notify("다시 로그인 해 주세요");
    } else if (request['git_success']) {
        make_notify("깃 푸쉬에 성공했어요");
    }
});

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
        let token = await fetch(aws_server + "/codeToToken/" + code).then(res => res.text());

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
    else if (request.action === 'BOJ_submit') {
        let find_BOJ_result = setInterval(async () => {
            const repoResponse = await fetch(`${aws_server}/BOJSubmit/${request.data['username']}/${request.data['p_num']}`).then(res => res.json());
            let res_code = repoResponse.result.split(" ")[0];
            if (res_code == "기다리는" || res_code == "채점") return;
            clearInterval(find_BOJ_result);
            if (res_code == "맞았습니다!!") {
                let data = {
                    code: request.data['code'],
                    title: request.data['title'],
                    lang: request.data['lang'],
                    velocity: repoResponse.time,
                    memory: repoResponse.memory
                }
                make_notify("'" + data.title + "' 문제의 해결을 감지했어요!");
                chrome.storage.local.set({"git_pending": true});
                chrome.storage.local.set({"git_message": "깃 인스턴스를 만드는 중이에요"});
                chrome.storage.local.set({"progress_rate": "0"});
                let git = new GitHub(data, request.data.token, JSON.parse(request.data["username_from_storage"]));
                git.upload_file();
            }
        }, 20000)
    }
});


let get_today = () => {
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear().toString().slice(-2);
    var currentMonth = ('0' + (currentDate.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 1을 더해줍니다.
    var currentDay = ('0' + currentDate.getDate()).slice(-2);
    var currentHour = currentDate.getHours();
    var currentMinute = currentDate.getMinutes();
    var currentSecond = currentDate.getSeconds();

    var today = {
        year: currentYear,
        month: currentMonth,
        day: currentDay,
        hour: currentHour,
        minute: currentMinute,
        second: currentSecond
    }

    return today
}

class GitHub {

    /**
     * 생성자에는 파일생성에 필요한 데이터와 api 실행을 위한 토큰이 필요해요
     * @param {object} data 
     * @param {String} token 
     * @param {object} username
     */
    constructor(data, token, username) {
        this.update(data);
        this.token = token
        this.username = username;
        let date = get_today();
        this.today = this.make_today(date);
        this.time = this.make_time(date);
        this.channel = new BroadcastChannel('git_pending_process');
        this.channel.postMessage({action:"start_process"});
    }

    /**
     * 날짜를 만들어주는 함수에요
     * @param {*} date 
     * @returns {String} 날짜
     */
    make_today = (date) => {
        return date.year + "-" + date.month + "-" + date.day;
    }

    /**
     * 시간을 만들어주는 함수에요
     * @param {*} date 
     * @returns {String} 시간
     */
    make_time = (date) => {
        return date.hour + ":" + date.minute + ":" + date.second;
    }

    /**
     * 객체 생성을 위해 파일 생성에 필요해서 사이트에서 파싱한 데이터를 입력해요
     * @param {object} data 
     */
    update(data) {
        this.data = {
            title: "",
            code: "",
            velocity: "",
            memory: "",
            lang: "",
            result: ""
        }
        for (let key in data) {
            this.data[key] = data[key];
        }
    }

    /**
     * 커밋하려는 파일의 내용을 만드는 함수에요
     * @return {object} request body 
     */
    make_commit_data = (base_tree_sha) => {

        // 언어별로 필요한 확장자 명과 주석이에요        
        let lang_helper = {
            'C': ['.c', '//'],
            'C++': ['.cpp', '//'],
            'C#': ['.cs', '//'],
            'Java': ['.java', '//'],
            'Python': ['.py', '#'],
            'Python3': ['.py', '#'],
            'JavaScript': ['.js', '//']
        }

        // 파일의 경로에요
        let path = this.today + "/" + this.data.title + lang_helper[this.data.lang][0];

        // 파일의 내용이에요
        let content = `${lang_helper[this.data.lang][1]} 문제 : ${this.data.title}
${lang_helper[this.data.lang][1]} 결과 : ${this.data.result} / 속도: ${this.data.velocity} / 메모리 : ${this.data.memory}
${lang_helper[this.data.lang][1]} 제출시각 : ${this.today}  ${this.time}
${this.data.code}`

        let data = {
            base_tree: base_tree_sha,
            "tree": [
                {
                    "path": path,
                    "mode": "100644",
                    "type": "blob",
                    "content": content
                }
            ]
        }

        return data
    }


    /**
     * 기본 브랜치를 찾는 함수에요
     * @returns {String} 기본브랜치 명 (성공)
     * @returns {Number} 0 (실패)
     */
    find_default_branch = async (owner, repo) => {

        // 레포지토리 정보를 가져오기 위한 api의 주소에요
        const defaultBranchUrl = `https://api.github.com/repos/${owner}/${repo}`

        const repoResponse = await fetch(defaultBranchUrl, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });

        const repoData = await repoResponse.json();

        if (!repoData.hasOwnProperty("default_branch")) {
            return 0;
        }

        let defaultBranch = repoData.default_branch;
        return defaultBranch
    }

    /**
     * 해당 브런치의 마지막 커밋의 해쉬값을 찾는 함수에요
     * @returns {String} 해쉬값 (성공)
     * @returns {Number} 0 (실패)
     */
    find_last_commit_sha = async (owner, default_branch, repo) => {

        // 마지막 커밋의 해쉬를 얻기 위한 api 주소에요
        const branchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${default_branch}`;

        // http 요청을 보내요
        const branchResponse = await fetch(branchUrl, {

            // 토큰을 해더에 저장해요
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });

        const branchData = await branchResponse.json();

        if (!branchData.hasOwnProperty('object')) {
            return 0;
        }

        let currentCommitSha = branchData.object.sha;

        return currentCommitSha
    }

    /**
     * 이함수를 사용해 베이스 트리의 해쉬값을 찾아요
     * @return {String} 해쉬값 (성공)
     * @returns {Number} 0 (실패)
     */
    find_base_tree_sha = async (owner, repo, last_commit_sha) => {

        // api의 주소
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${last_commit_sha}`;

        // http 요청을 보내요
        const branchResponse = await fetch(apiUrl, {

            // 토큰을 해더에 저장해요
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });

        if (!branchResponse.ok) {
            return 0;
        }
        const baseTreeData = await branchResponse.json();
        return baseTreeData.sha
    }

    /**
     * 새로운 트리를 만들고 해쉬값을 얻기 위한 함수에요
     * @return {String} 해쉬값 (성공)
     * @returns {Number} 0 (실패)
     */
    make_new_tree_sha = async (owner, repo, base_tree_sha) => {

        // api의 주소
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees`;

        // 보내려는 데이터에요
        const commit_data = this.make_commit_data(base_tree_sha);

        // http 요청을 보내요
        const new_tree_sha = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commit_data)
        }).then(res => res.json());

        if (new_tree_sha.sha == undefined) {
            return 0;
        }

        return new_tree_sha.sha;
    }

    /**
     * 정말 커밋이 수행이 되는 함수에요
     * @return {String} 해쉬값 (성공)
     * @returns {Number} 0 (실패)
     */
    make_new_commit_sha = async (owner, repo, last_commit_sha, new_tree_sha) => {

        // api 주소에요
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits`;

        // request body 에요
        const commit_data = {
            "parents": [last_commit_sha],
            "tree": new_tree_sha,
            "message": 'auth_commited'
        };

        // http 요청을 보내요
        const new_commit_sha = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commit_data)
        }).then(res => res.json());

        if (new_commit_sha.sha == undefined) {
            return 0;
        }

        return new_commit_sha.sha;
    }

    /**
     * 푸쉬가 이루어지는 함수에요
     * @return 0 실패
     * @return 1 성공
     */
    make_git_push = async (owner, repo, new_commit_sha, default_branch) => {
        // api 주소에요
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${default_branch}`;

        // request body 에요
        const commit_data = {
            "sha": new_commit_sha
        };

        // http 요청을 보내요
        const new_push_result = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commit_data)
        }).then(res => res.json());

        if (new_push_result.node_id != undefined) return 1
        return 0
    }

    /**
     * 이 함수는 다음과 같은 과정을 수행하여 깃헙에 파일을 올려요
     * 1. 리포지토리의 default branch를 찾아요
     * 2. 해당 브런치의 마지막 커밋의 해쉬값을 찾아요
     * 3. 찾은 해쉬값을 이용해 베이스 트리의 해쉬값을 찾아요
     * 4. 베이스 트리에 커밋하고자 하는 파일을 적어 새로운 트리를 만들고 해쉬값을 얻어요
     * 5. 새로운 트리에 4에서 작성한 내용을 적어요 (커밋)
     * 6. 푸쉬해요 (푸쉬)
     */
    upload_file = async () => {

        console.log("ehckr");
        // 저장소에서 레포지터리 명을 가져와요
        let repo = await new Promise((resolve, reject) => {
            chrome.storage.local.get("basic_directory", result => {
                resolve(result["basic_directory"]);
            })
        })

        /** 푸쉬 프로세스 중 중단 되었을 경우 앱을 초기화 시켜줘요 */
        let process_fail = () => {
            // 로그아웃
            chrome.storage.local.remove("token");
            chrome.storage.local.remove("username");
            chrome.storage.local.remove("solve_detect");
            chrome.storage.local.remove("start_time");
            chrome.storage.local.remove("try_login");
            chrome.storage.local.remove("repo_pending");

            this.channel.postMessage({action: "fail_process"});
            this.channel.close();
            make_notify("푸쉬에 실패했어요\n다시 로그인 해주세요")
        }

        // 기본브랜치를 찾아요
        let default_branch = await new Promise((resolve, reject) => resolve(this.find_default_branch(this.username.login, repo)));
        if (default_branch == 0) {
            process_fail();
            return;
        }
        this.channel.postMessage({action: "progress", rate: "10%", msg: "기본브랜치를 찾았어요"});

        // 기본 브랜치의 마지막 커밋의 해쉬값을 찾아요
        let last_commit_sha = await new Promise((resolve, reject) => resolve(this.find_last_commit_sha(this.username.login, default_branch, repo)));
        if (last_commit_sha == 0) {
            process_fail();
            return;
        }
        this.channel.postMessage({action: "progress", rate: "30%", msg: "마지막 커밋의 해쉬값을 찾았어요"});

        // 찾은 해쉬값을 이용해 베이스 트리의 해쉬값을 찾아요
        let base_tree_sha = await new Promise((resolve, reject) => resolve(this.find_base_tree_sha(this.username.login, repo, last_commit_sha)));
        if (base_tree_sha == 0) {
            process_fail();
            return;
        }
        this.channel.postMessage({action: "progress", rate: "50%", msg: "베이스 트리의 해쉬값을 찾았어요"});


        // 베이스 트리에 커밋하고자 하는 파일을 적어요
        let new_tree_sha = await new Promise((resolve, reject) => resolve(this.make_new_tree_sha(this.username.login, repo, base_tree_sha)));
        if (new_tree_sha == 0) {
            process_fail();
            return;
        }
        this.channel.postMessage({action: "progress", rate: "70%", msg: "파일을 작성했어요"});


        // 정말 커밋이 이루어져요. 새로운 커밋의 해쉬값을 얻어요
        let new_commit_sha = await new Promise((resolve, reject) => resolve(this.make_new_commit_sha(this.username.login, repo, last_commit_sha, new_tree_sha)));
        if (new_commit_sha == 0) {
            process_fail();
            return;
        }
        this.channel.postMessage({action: "progress", rate: "90%", msg: "새로운 커밋을 완료했어요"});

        // 푸쉬가 이루어 져요
        let push_result = await new Promise((resolve, reject) => resolve(this.make_git_push(this.username.login, repo, new_commit_sha, default_branch)));
        if (push_result == 0) {
            process_fail();
            return;
        }
        this.channel.postMessage({action: "progress", rate: "100%", msg: "푸쉬에 성공했어요"});
        make_notify("푸쉬 성공!");


        this.channel.close();
    }
}