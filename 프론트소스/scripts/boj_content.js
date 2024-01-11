let boj_parsing = () => {
    let code_box = document.querySelector(".CodeMirror-code");
    let code = "";
    for (let i of code_box.children) {
        code += i.firstChild.nextElementSibling.innerText
        code += '\n';
    }
    let lang = document.querySelector("#language_chosen").firstChild.innerText.split(" ")[0];
    let title = document.querySelector("legend").innerText;
    let username = document.querySelector(".username").innerText;
    let p_num = window.location.pathname.split("/").pop();        

    return {
        platForm: "BOJ",
        title: title,
        code: code,
        lang: lang,
        username: username,
        p_num: p_num,
    }
}

let init = () => {

    let submit_button = document.querySelector("#submit_button");
    submit_button.addEventListener("click", async () => {

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

        // 유저네임을 가져와요
        let username_from_storage = await new Promise((resolve, reject) => {
            chrome.storage.local.get("username", result => resolve(result["username"]));
        })

        // 데이터를 파싱해요
        let data = boj_parsing();

        data['token'] = token;
        data['username_from_storage'] = username_from_storage;

        chrome.runtime.sendMessage({ action: 'BOJ_submit', data: data });
    })
}
init();