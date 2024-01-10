// 리포지토리 대표이름은 algorithm_auto_push_extension

/** 팝업창이 열리자 마자 이 함수가 실행되요 */
let init = async () => {


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
        let github_image = document.getElementById('github_image');
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
        let repo_make_pending = document.getElementById('repo_make_pending');
        let after_login_try = document.getElementById('after_login_try');
        let before_login_try = document.getElementById('before_login_try');
        let failure_of_login_try = document.getElementById('failure_of_login_try');
        let github_profile_images = document.querySelectorAll('.github_profile_image');

        /** 저장된 핫키를 불러와서 표시하는 함수에요 */
        let display_hotkey = () => {
            chrome.storage.local.get("hot_key", function (result) {
                current_hot_key.innerText = result["hot_key"];
            });
        }
        display_hotkey();


        /** background.js에서 call을 받기 위한 객체에요 */
        const channel = new BroadcastChannel('repo_notice');
        channel.onmessage = event => {
            // 타이머를 정지 시켜요
            clearInterval(event.data["timer_id"]);
            
            if (event.data.result) {
                repo_make_pending.classList.add("hide");
                visit_rep_box.classList.remove("hide");
                solve_detect_check.checked = true;
                check_box_container.classList.remove("hide");
                chrome.storage.local.set({ solve_detect: true });
                channel.close();
            } else {
                let repo_make_message = document.getElementById("repo_make_message");
                repo_make_message.innerHTML = "레포지터리 생성에 실패한거 같습니다."
                setTimeout(() => {
                    repo_make_pending.classList.add("hide");
                    make_rep_box.classList.remove("hide");
                }, 5000)
            }
        };

        const channel_for_login = new BroadcastChannel('end_try_login');
        channel_for_login.onmessage = event => {
            if (event == false) {
                after_login_try.classList.add("hide");
                failure_of_login_try.classList.remove('hide');
                setTimeout(() => {
                    failure_of_login_try.classList.add("hide");
                    before_login_try.classList.remove("hide");
                }, 2000)
            }
            
            else {
                after_login_try.classList.add("hide");
                before_login_try.classList.remove("hide");
            }
        };

        /** 
         * 레포지터리 생성 타이머를 작동시켜요 
         * @return {Number} 타이머의 ID를 반환해요
         */
        let run_timer = async () => {

            /** 분을 두자리 수로 만들어주는 함수에요 */
            let make_secont_number = (number) => {
                if (number < 10) {
                    return '0' + number;
                } else {
                    return '' + number;
                }
            }

            // 경과 타이머를 작동시켜요
            let start_time = await new Promise((resolve, reject) => {
                chrome.storage.local.get("start_time", result => resolve(result["start_time"]))
            });

            let currentDate = new Date();
            let currentHour = currentDate.getHours();
            let currentMinute = currentDate.getMinutes();
            let currentSecond = currentDate.getSeconds();
            let current_time = currentHour * 60 * 60 + currentMinute * 60 + currentSecond;

            if (start_time == undefined) {
                chrome.storage.local.set({ "start_time": current_time });
                start_time = current_time;
            }
            
            else {
                start_time = Number(start_time);
                if (start_time > current_time) {
                    current_time + 86400;
                }
            }

            let count = current_time - start_time;

            let repo_elapsed_time_minute = document.getElementById("repo_elapsed_time_minute");
            let repo_elapsed_time_second = document.getElementById("repo_elapsed_time_second");
            repo_elapsed_time_minute.innerText = Math.floor(count / 60);
            repo_elapsed_time_second.innerText = make_secont_number(count % 60);
            let elapsed_timer = document.getElementById("elapsed_timer");
            elapsed_timer.classList.remove("hide");

            /** 레포지터리 만들기 버튼을 누루고 난뒤 경과 시간을 다루는 타이머에요 */
            let maker_repo_timer = setInterval(() => {
                repo_elapsed_time_minute.innerText = Math.floor(count / 60);
                repo_elapsed_time_second.innerText = make_secont_number(count % 60);
                count++;
            }, 1000)

            return maker_repo_timer;
        }

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

        // 토큰이 있다면
        if (token != undefined) {

            // 로그인 버튼을 숨기고, 스피너를 돌려요
            login_button_box.classList.add("hide");
            spinner_box.classList.remove("hide");
        }

        // 토큰이 없다면 현재로그인 시도중이기 때문인지 확인해요
        else {

            /** 이 변수가 true라면 현재 백그라운드에서 로그인 시도 중이라는 뜻이에요 */
            let login_pending = await new Promise((resolve, reject) => {
                chrome.storage.local.get("try_login", result => resolve(result["try_login"]));
            })

            // 현재 로그인 시도 중이란 것
            if (login_pending != undefined) {
                before_login_try.classList.add("hide");
                after_login_try.classList.remove("hide");
            }
        }

        // 토큰의 유효성을 검사해요
        let username = await new Promise((resolve, reject) => {
            resolve(is_token_valid(token));
        })

        // 토큰이 유효하지 않다면
        if (username == 0) {

            // 변수를 초기화 해줘요
            token = undefined;
            chrome.storage.local.remove("token");
            username = undefined;
            chrome.storage.local.remove("username");
            // 스피너 버튼을 숨기고, 로그인 버튼을 다시 보여줘요
            spinner_box.classList.add("hide");
            login_button_box.classList.remove("hide");
        }

        // 토큰이 유효하다면
        else {

            // 프로필이미지로 교체

            for (e of github_profile_images) {
                e.src = username.avatar_url
            }

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

                // 펜딩 하고 있단 상태가 있다면 없애주구요
                chrome.storage.local.remove("repo_pending");

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

                // 해결 감지를 삭제해 줘요
                chrome.storage.local.remove("solve_detect");

                // 스피너, 레포지터리 방문 버튼, 체크박스를 숨기고
                spinner_box.classList.add("hide");
                visit_rep_box.classList.add("hide");
                check_box_container.classList.add("hide");

                /** 레포 펜딩 여부를 저장함 */
                let is_repo_pending = await new Promise((resolve, reject) =>
                    chrome.storage.local.get("repo_pending", result => resolve(result["repo_pending"])
                ))

                // 만약 아직 레포만드는게 펜딩중이라면
                if (is_repo_pending) {
                    repo_make_pending.classList.remove("hide");
                    make_rep_box.classList.add("hide");

                    // 타이머도 다시 작동시켜요
                    run_timer();
                }

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
            let joined_hot_key = hot_key_to_set.join("+");
            setObj['hot_key'] = joined_hot_key;
            chrome.storage.local.set(setObj);
            change_state = false;

            document.getElementById("hot_key_unchanged").classList.add("hide");
            document.getElementById("hot_key_changed").classList.remove("hide");
        });

        // 변경중인 단축키 셋을 바꾸고 자할 때 누르는 버튼이에요
        retry_button.addEventListener('click', () => {
            clear_hot_key_to_set();
        })

        // 단축키를 바꾸는 것을 취소하는 버튼이에요
        cancel_button.addEventListener('click', () => {
            toggle_button_show_hide();
            display_hotkey();
            change_state = false;
        })

        // 깃허브 아이콘을 누르면 동작하는 이벤트에요
        github_image.addEventListener('click', () => {
            window.open('https://github.com/', '_blank');
        })

        // 로그인 버튼이에요
        login_button.addEventListener('click', () => {
            chrome.storage.local.set({"try_login": true});
            oAuth2.begin();
            login_button_box.classList.toggle('hide');
            spinner_box.classList.toggle('hide');
        })

        // 레포지터리 생성 버튼이에요
        make_rep_button.addEventListener('click', async () => {

            // 레포지토리 만들기 버튼을 숨기고
            make_rep_box.classList.add("hide");

            // 레포 팬딩 디브를 켜요
            repo_make_pending.classList.remove("hide");

            // 현재 팬딩중이란 상황을 알려줘요
            chrome.storage.local.set({ "repo_pending": true });

            /** 경과타이머 아이디에요 */
            let timer_id = await new Promise((resolve, reject) => resolve(run_timer()));

            const apiUrl = 'https://api.github.com/user/repos';

            let data = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: basic_directory,
                    auto_init: true,
                    private: false,
                    gitignore_template: 'Node',
                }),
            }).then(res => res.json());

            // 리포지터리가 만들어 졌다면
            if (data.id != undefined) {

                // 서비스워커한테 계속 username의 repository목록이 갱신됐는지 물어봐요
                chrome.runtime.sendMessage({ action: 'canPendingClose', data: token, basic_directory: basic_directory, timer_id: timer_id });
            }

            // 리포지터리가 만들어 지지 못했다면
            else {
                make_rep_box.classList.remove("hide");
                repo_make_pending.classList.add("hide");
                clearInterval(timer_id)
            }
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

        let tb = document.getElementById("tb");
        tb.addEventListener("click", () => {
            let ddd = document.createElement("div");
            ddd.style.width = "100px";
            ddd.style.height = "100px";
            ddd.style.background = "red";
            document.body.appendChild(ddd);
        })
    })
}
init();

