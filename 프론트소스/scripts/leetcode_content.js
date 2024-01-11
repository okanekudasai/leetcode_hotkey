
/**
 * raw 코드를 찾는 함수에요
 * @returns {String} code
 */
let find_raw_code = async () => {
    let code = "";

    let code_parent = await new Promise((resolve, reject) => {
        let find_code = setInterval(() => {
            let el = document.querySelector("code");
            if (el == null) return;
            clearInterval(find_code);
            resolve(el);
        }, 100)
    });
        
    for (i of code_parent.children) {
        code += i.innerText;
        code += "\n"
    }
    return code;
}

/**
 * 깃허브에 올릴 데이를 파싱하기위한 함수에요
 * @return 0 - Accept가 안됨
 * @return {object} - Accept 됨
 */
let parsing_process = () => {

    //데이터를 파싱해요
    let data = parsing_data();

    // 파싱데이터에서 해결여부를 찾아 해결한 것이 아닐 경우 넘어가요
    if (data.result != "Accepted") return 0;

    // 파싱데이터를 찾았다면 객체를 리턴해요
    return data;
}


/**
 * 데이터를 파싱하기 위한 함수에요
 * @return 문제제목, 결과, 속도, 메모리, 언어를 제공해요
 */
let parsing_data = () => {
    let currentURL = window.location.href;
    let title;
    let problemName = currentURL.split('/')[4];
    if (problemName) {
        title = problemName;
    } else {
        title = "문제 이름을 찾을 수 없습니다.";
    }
    let result = document.querySelector("[data-e2e-locator='submission-result']").innerText;
    let lang = document.querySelector("code").parentElement.parentElement.parentElement.previousElementSibling.innerText;
    let run_info = document.querySelectorAll("span.text-sd-foreground.text-lg.font-semibold");
    let velocity = run_info[0].innerText + "ms";
    let memory = run_info[1].innerText + "MB";
    return { title, result, velocity, memory, lang };
}

/**
 * 깃허브에 업로드하는 프로세스를 진행하는 함수에요
 */
let upload_process = async (data, token) => {

    // 토큰의 유효성을 검사할께요
    let username = await new Promise(async (resolve, reject) => {
        resolve(is_token_valid(token));
    })

    // 만약 토큰의 유효성이 없다면 더이상 진행하지 않아요
    if (username == 0) return;

    // 깃 commit, push api를 사용하기 위해 git 객체를 생성해요
    let git = new GitHub(data, token, username);

    // 업로드를 시작해요
    git.upload_file();
}

let let_submit = async () => {
    
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

    // raw code를 찾아요
    let code = await new Promise((resolve, reject) => resolve(find_raw_code()));

    // 채점을 몇초동안 할 것인지를 정하는 변수에요
    // cycle이 0이 되어도 채점이 끝나지 않았다면 오류라고 생각할게요

    // 1.5초의 시간을 두고(체점이 완료되었다고 파싱할 데이터가 모두 생성된건 아닐 수 있어요)
    // 데이터 파싱 및 깃허브 푸쉬를 시작해요 
    setTimeout(async () => {

        // 데이터 파싱해서 변수에 할당해요
        let data = parsing_process()

        // 만약 찾은 데이터가 없다면 작업을 중단해요
        if (data == 0) return;

        // 위 함수에서 파싱하지 못했던 코드도 파싱할게요
        data["code"] = code;
        
        // 깃허브 푸쉬를 시작해요
        upload_process(data, token);

    }, 1500)
}

// 옵저브할 대상 요소를 선택합니다.
var targetElement = undefined;
var find_submit_button = setInterval(() => {
    targetElement = document.querySelector('[data-e2e-locator="console-submit-button"]');
    if (targetElement == null) return;
    // 대상 요소와 설정을 사용하여 옵저버를 시작합니다.
    observer.observe(targetElement, config);
    clearInterval(find_submit_button);
}, 100)

// MutationObserver를 생성하고 콜백 함수를 정의합니다.
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (targetElement.classList.length == 14) let_submit();
        }
    });
});

// 옵저버가 감시할 설정을 정의합니다.
var config = { attributes: true, attributeFilter: ['class'] };
