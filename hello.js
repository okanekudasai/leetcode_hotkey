// 리포지토리 대표이름은 algorithm_auto_push_extension

document.addEventListener('DOMContentLoaded', () => {
    var current_hot_key = document.getElementById('current_hot_key');
    var change_button = document.getElementById('change_button');
    var check_button = document.getElementById('check_button');
    var retry_button = document.getElementById('retry_button');
    var cancel_button = document.getElementById('cancel_button');
    var login_button = document.getElementById('login_button');
    var state_complete = document.getElementById('state_complete');
    var state_change = document.getElementById('state_change');
    var login_button_box = document.getElementById('login_button_box');
    var spinner_box = document.getElementById('spinner_box');
    var make_rep_box = document.getElementById('make_rep_box');
    var make_rep_button = document.getElementById('make_rep_button');
    var visit_rep_box = document.getElementById('visit_rep_box');
    var visit_rep_button = document.getElementById('visit_rep_button');
    var check_box_container = document.getElementById('check_box_container');
    var solve_detect_check = document.getElementById('solve_detect_check');
    var logout_button_box = document.getElementById('logout_button_box');
    var logout_button = document.getElementById('logout_button');
    var change_state = false;
    var hot_key_to_set = [];

    let confirm_token = () => {
        chrome.storage.local.get("token", function (result) {
            let token = result["token"];
            if (token != undefined) {
                login_button_box.classList.add("hide");
                spinner_box.classList.remove("hide");
                let getUserName = () => {
                    const headers = new Headers();
                    headers.append('Authorization', `token ${token}`);
                    fetch('https://api.github.com/user', {
                        method: 'GET',
                        headers: headers,
                    }).then(res => res.json()).then(data => {
                        if (data["message"] == "Bad credentials") {
                            console.log("토큰 만료");
                            chrome.storage.local.set({ "username": undefined });
                            login_button_box.classList.remove("hide");
                        } else {
                            console.log("토큰 유효");
                            chrome.storage.local.get("username", function (result) {
                                let username = JSON.parse(result["username"])
                                console.log(username);
                                fetch(username["repos_url"], {
                                    method: 'GET',
                                }).then(res => res.json()).then(data => {
                                    flag = false // 일단 레포지토리를 찾지 못한상태
                                    for (let i of data) {
                                        if (i["name"] == 'algorithm_auto_push_extension') {
                                            flag = true; // 이미 해당리포지토리가 있으면 레포지토리 만들기 버튼을 숨겨요
                                            console.log(i["name"]);
                                            break;
                                        }
                                    }
                                    console.log(flag)
                                    if (flag) { // 레포지토리가 이미 있다면 레포지토리 만들기 버튼을 숨길게요
                                        make_rep_box.classList.add("hide");
                                        visit_rep_box.classList.remove("hide");
                                        check_box_container.classList.remove("hide");
                                    } else {
                                        make_rep_box.classList.remove("hide");
                                        visit_rep_box.classList.add("hide");
                                        check_box_container.classList.add("hide");
                                    }
                                })
                            })
                            logout_button_box.classList.remove("hide");
                            chrome.storage.local.get("solve_detect", (result) => {
                                solve_detect_check.checked = result["solve_detect"];
                            })
                        }
                        spinner_box.classList.add("hide");
                    })
                }
                getUserName();
            }
        });
    }
    confirm_token();

    var init = () => {
        chrome.storage.local.get("hot_key", function (result) {
            current_hot_key.innerText = result["hot_key"];
        });
    }
    var clear_hot_key_to_set = () => {
        hot_key_to_set.length = 0;
        current_hot_key.innerText = " "
    }
    init();
    change_button.addEventListener('click', () => {
        toggle_button_show_hide();
        clear_hot_key_to_set();
        change_state = true;
    });
    check_button.addEventListener('click', () => {
        toggle_button_show_hide();
        let setObj = {};
        setObj['hot_key'] = hot_key_to_set.join("+");
        chrome.storage.local.set(setObj);
        change_state = false;
    });
    retry_button.addEventListener('click', () => {
        clear_hot_key_to_set();
    })
    cancel_button.addEventListener('click', () => {
        toggle_button_show_hide();
        init();
        change_state = false;
    })
    login_button.addEventListener('click', () => {
        oAuth2.begin();
        login_button_box.classList.toggle('hide');
        spinner_box.classList.toggle('hide');
    })
    make_rep_button.addEventListener('click', () => {
        chrome.storage.local.get("token", (result) => {
            const accessToken = result["token"];
            const apiUrl = 'https://api.github.com/user/repos';

            const repoData = {
                name: 'algorithm_auto_push_extension',
            };

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(repoData),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Repository created:', data);
                    make_rep_box.classList.add("hide");
                    visit_rep_box.classList.remove("hide");
                    check_box_container.classList.remove("hide");
                })
                .catch(error => {
                    console.error('Error creating repository:', error);
                });
        })
    })
    visit_rep_button.addEventListener('click', () => {
        chrome.storage.local.get("username", function (result) {
            let username = JSON.parse(result["username"]);
            const linkUrl = username["html_url"] + "/algorithm_auto_push_extension";
            window.open(linkUrl, '_blank');
        })
    })
    solve_detect_check.addEventListener('change', function () {
        if (solve_detect_check.checked) {
            console.log('체크박스가 체크되었습니다.');
            chrome.storage.local.set({ "solve_detect": true })
        } else {
            console.log('체크박스가 체크 해제되었습니다.');
            chrome.storage.local.set({ "solve_detect": false })
        }
    });
    logout_button.addEventListener('click', () => {
        chrome.storage.local.set({ "token": "" });
        chrome.storage.local.set({ "username": "" });
        chrome.storage.local.set({ "solve_detect": false })
        logout_button_box.classList.add("hide");
        login_button_box.classList.remove("hide");

    })
    toggle_button_show_hide = () => {
        change_button.classList.toggle('hide');
        check_button.classList.toggle('hide');
        retry_button.classList.toggle('hide');
        cancel_button.classList.toggle('hide');
        state_complete.classList.toggle('hide');
        state_change.classList.toggle('hide');
        current_hot_key.classList.toggle('blinking');
    }
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