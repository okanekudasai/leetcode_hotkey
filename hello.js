// 리포지토리 대표이름은 algorithm_auto_push_extension

/** 팝업창이 열리자 마자 이 함수가 실행되요 */
let init = async () => {

    // 저장된 핫키를 불러와서 표시해요
    chrome.storage.local.get("hot_key", function (result) {
        current_hot_key.innerText = result["hot_key"];
    });

    /**
     * 로그인이 정말 되어있는지 토큰의 유효성을 검사해 줘요
     * @param {String} token 
     * @returns {object} 유저의 여러정보를 담고 있어요
     * @returns 0 - 토큰이 유효하지 않다는 뜻이에요
     */
    let is_token_valid = async (token) => {

        // 유저네임에 github로부터 로그인 정보를 가져와요
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

        // message에는 토큰이 유효하지 않은 등의 로그인 되지 않은 이유가 담겨있어요
        // 즉 message에 뭔가 있다는 건 로그인 되지 않았음을 의미해요
        // message에 아무것도 없다면 username을 그대로 반환해요
        if (username.message == undefined) return username;

        // message에 뭔가 있다면 로그인을 해제해 줘요
        else {
            chrome.storage.local.remove("token");
            token = undefined
            chrome.storage.local.remove("username");
            username = undefined
            return 0;
        }
    }

    // 아래부터는 팝업창에 모든 요소가 로드 되었을 떄 실행할게요
    document.addEventListener('DOMContentLoaded', async () => {

        // 팝업의 요소를 맵핑해요
        let current_hot_key = document.getElementById('current_hot_key');
        let change_button = document.getElementById('change_button');
        let check_button = document.getElementById('check_button');
        let retry_button = document.getElementById('retry_button');
        let cancel_button = document.getElementById('cancel_button');
        let login_button = document.getElementById('login_button');
        let state_complete = document.getElementById('state_complete');
        let state_change = document.getElementById('state_change');
        let login_button_box = document.getElementById('login_button_box');
        let spinner_box = document.getElementById('spinner_box');
        let make_rep_box = document.getElementById('make_rep_box');
        let make_rep_button = document.getElementById('make_rep_button');
        let visit_rep_box = document.getElementById('visit_rep_box');
        let visit_rep_button = document.getElementById('visit_rep_button');
        let check_box_container = document.getElementById('check_box_container');
        let solve_detect_check = document.getElementById('solve_detect_check');
        let logout_button_box = document.getElementById('logout_button_box');
        let logout_button = document.getElementById('logout_button');

        /** 현재 단축키를 변경 중인지 알려줘요 */
        let change_state = false;
        let hot_key_to_set = [];

        // 레포지토리의 이름가져와요
        let basic_directory = await new Promise((resolve, reject) => {
            chrome.storage.local.get("basic_directory", result => resolve(result["basic_directory"]));
        })

        // 토큰을 가져와요
        let token = await new Promise((resolve, reject) => {
            chrome.storage.local.get("token", result => resolve(result["token"]));
        })

        console.log(token);
        // 토큰이 있다면
        if (token != undefined) {

            // 로그인 버튼을 숨기고, 스피너를 돌려요
            login_button_box.classList.add("hide");
            spinner_box.classList.remove("hide");
        }

        // 토큰의 유효성을 검사해요
        let username = await new Promise((resolve, reject) => {
            resolve(is_token_valid(token));
        })

        // 토큰이 유효하지 않다면
        if (username == 0) {

            // 변수를 초기화 해줘요
            token = undefined;
            username = undefined;
            // 스피너 버튼을 숨기고, 로그인 버튼을 다시 보여줘요
            spinner_box.classList.add("hide");
            login_button_box.classList.remove("hide");
        }

        // 토큰이 유효하다면
        else {

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

            // 레포지토리가 이미 있다면 
            if (flag) {

                // 해결 감지가 켜져 있는지 확인해서 반영해요
                solve_detect_check.checked = await new Promise((resolve, reject) =>
                    chrome.storage.local.get("solve_detect", result => resolve(result["solve_detect"])
                ))

                // 스피너, 레포지토리 만들기 버튼을 숨기고
                spinner_box.classList.add("hide");
                make_rep_box.classList.add("hide");

                // 최종적으로 로그아웃 버튼 영역을 표시해요
                logout_button_box.classList.remove("hide");
            }

            // 레포지터리가 없다면
            else {

                // 스피너, 레포지터리 방문 버튼, 체크박스를 숨기고
                spinner_box.classList.add("hide");
                visit_rep_box.classList.add("hide");
                check_box_container.classList.add("hide");

                // 최종적으로 로그아웃 버튼 영역을 표시해요
                logout_button_box.classList.remove("hide");
            }

        }

        /** 변경중인 단축키 키셋을 지우는 함수에요 */
        var clear_hot_key_to_set = () => {
            hot_key_to_set.length = 0;
            current_hot_key.innerText = " "
        }

        // 단축기 변경을 하고자할 때 누르는 버튼이에요
        change_button.addEventListener('click', () => {
            toggle_button_show_hide();
            clear_hot_key_to_set();
            change_state = true;
        });


        // 바꾼 단축키로 확인할 때 부르는 버튼이에요
        check_button.addEventListener('click', () => {
            toggle_button_show_hide();
            let setObj = {};
            setObj['hot_key'] = hot_key_to_set.join("+");
            chrome.storage.local.set(setObj);
            change_state = false;
        });

        // 변경중인 단축키 셋을 바꾸고 자할 때 누르는 버튼이에요
        retry_button.addEventListener('click', () => {
            clear_hot_key_to_set();
        })

        // 단축키를 바꾸는 것을 취소하는 버튼이에요
        cancel_button.addEventListener('click', () => {
            toggle_button_show_hide();
            init();
            change_state = false;
        })

        // 로그인 버튼이에요
        login_button.addEventListener('click', () => {
            oAuth2.begin();
            login_button_box.classList.toggle('hide');
            spinner_box.classList.toggle('hide');
        })

        // 레포지터리 생성 버튼이에요
        make_rep_button.addEventListener('click', async () => {
            const apiUrl = 'https://api.github.com/user/repos';

            const repoData = {
                name: basic_directory,
            };


            let data = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: repoName,
                    auto_init: true,
                    private: false,
                    gitignore_template: 'Node',
                }),
            })

            // 레포지터리 생성 되는지 않되는 지 모르겠음
        })

        // 레포지터리 방문 버튼이에요
        visit_rep_button.addEventListener('click', () => {
            const linkUrl = username["html_url"] + "/" + basic_directory;
            window.open(linkUrl, '_blank');
        })

        // 해결 감지 버튼이 눌렸을때 작동해요
        solve_detect_check.addEventListener('change', function () {
            if (solve_detect_check.checked) {
                chrome.storage.local.set({ "solve_detect": true })
            } else {
                chrome.storage.local.set({ "solve_detect": false })
            }
        });

        // 로그아웃 버튼이에요
        logout_button.addEventListener('click', async () => {
            chrome.storage.local.remove("token");
            token = undefined
            chrome.storage.local.remove("username");
            username = undefined
            chrome.storage.local.set({ "solve_detect": false })
            logout_button_box.classList.add("hide");
            login_button_box.classList.remove("hide");

            token = await new Promise((resolve, reject) => {
                chrome.storage.local.get("token", result => resolve(result["token"]));
            })
            console.log("!!!" + token);
        })

        // 토글 해줘요
        toggle_button_show_hide = () => {
            change_button.classList.toggle('hide');
            check_button.classList.toggle('hide');
            retry_button.classList.toggle('hide');
            cancel_button.classList.toggle('hide');
            state_complete.classList.toggle('hide');
            state_change.classList.toggle('hide');
            current_hot_key.classList.toggle('blinking');
        }

        // 단축키 변경 중 일때 키를 누르면 작동해요
        document.addEventListener("keydown", (e) => {
            if (!change_state) return;
            if (hot_key_to_set.includes(e.code)) {
                let elementToRemove = e.code; // 제거할 요소 값
                let indexToRemove = hot_key_to_set.indexOf(elementToRemove);
                hot_key_to_set.splice(indexToRemove, 1);
            } else {
                hot_key_to_set.push(e.code);
            }
            current_hot_key.innerText = hot_key_to_set.join(" + ");
        })
    })
}
init();
