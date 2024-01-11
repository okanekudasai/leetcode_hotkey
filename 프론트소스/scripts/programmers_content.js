var run_button_click = () => {
    document.querySelector('#run-code').click();
}

chrome.runtime.sendMessage({ "need_hot_key": true })

/** 코드와 문제제목과 언어를 파싱해요 
 * @return {object} 파싱한 코드, 문제이름, 언어를 담은 데이터, 시간과 메모리는 항상 0이다.
*/
let parsing_data = () => {
    let a = document.querySelector('div.CodeMirror-code[role="presentation"]');
    let code = ""
    for (let i of a.children) {
        code += i.firstChild.nextSibling.innerText;
        code += "\n";
    }
    let title = document.querySelector(".challenge-title").innerText;
    let lang = document.querySelector(".dropdown-toggle").innerText;

    return {
        code: code,
        title: title,
        lang: lang.trim(),
        velocity: 0,
        memory: 0
    }
}


init = async () => {
    let submit_code = document.querySelector("#submit-code");
    submit_code.addEventListener("click", async () => {

        // 해결 감지가 켜져있는지 확인 해요 꺼져있다면 더이상 진행하지 않아요
        let is_solve_detect_check = await new Promise((resolve, reject) => {
            chrome.storage.local.get("solve_detect", (result) => resolve(result["solve_detect"]))
        })
        if (!is_solve_detect_check) return;

        // 사용자의 토큰을 찾아요
        let token = await new Promise((resolve, reject) => {
            chrome.storage.local.get("token", result => resolve(result["token"]))
        })

        // 토큰이 없다면 더이상 진행하지 않아요
        if (!token) return;

        let data = parsing_data();
        let modal_div = document.querySelector(".modal");
        console.log(modal_div);
        console.log(modal_div.classList);
        let solve_result = await new Promise((resolve, reject) => {
            let waiting_result_loop = setInterval(() => {
                for (let i of modal_div.classList) {
                    if (i == 'show') {
                        console.log("찾음");
                        clearInterval(waiting_result_loop);
                        resolve(true);
                        break;
                    }
                }
            }, 500)
        })
        if (solve_result == true) {
            if (document.querySelector(".modal-title").innerText == "정답입니다!") {
                // 토큰의 유효성을 검사할께요
                let username = await new Promise(async (resolve, reject) => {
                    resolve(is_token_valid(token));
                })

                // 만약 토큰의 유효성이 없다면 더이상 진행하지 않아요
                if (username == 0) return;

                console.log(data);
                // 깃 commit, push api를 사용하기 위해 git 객체를 생성해요
                let git = new GitHub(data, token, username);

                // 업로드를 시작해요
                git.upload_file();
            }
        }
    })
}

init();