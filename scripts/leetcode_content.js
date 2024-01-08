/**
 * 리트코드에서 런 단축키가 눌렸을 때 해당 버튼을 extension이 대신 클릭해줘요
 */
var run_button_click = () => {
    var leetcode_run = document.querySelector('[data-e2e-locator="console-run-button"]');
    leetcode_run.click();
}

/**
 * raw 코드를 찾는 함수에요
 * @returns {String} code
 */
let find_raw_code = () => {
    let code_parent = document.querySelector("#qd-content").firstChild.nextElementSibling.nextElementSibling.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.nextElementSibling.nextElementSibling.firstChild.firstChild.firstChild.firstChild.firstChild.nextElementSibling.firstChild.firstChild.nextElementSibling.nextElementSibling.nextElementSibling;
    let code = "";
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
    let last_submit = document.querySelector("#qd-content").firstChild.firstChild.firstChild.firstChild.firstChild.nextElementSibling.firstChild.firstChild.nextElementSibling.nextElementSibling.firstChild;
    let result = last_submit.firstChild.firstChild.firstChild.firstChild.firstChild.innerText;
    let lang = last_submit.firstChild.firstChild.nextElementSibling.firstChild.innerText;
    let velocity = last_submit.firstChild.firstChild.nextElementSibling.nextElementSibling.firstChild.nextElementSibling.innerText;
    let memory = last_submit.firstChild.firstChild.nextElementSibling.nextElementSibling.nextElementSibling.firstChild.nextElementSibling.innerText;
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
    if(username == 0) return;

    // 깃 commit, push api를 사용하기 위해 git 객체를 생성해요
    let git = new GitHub(data, token, username); 

    // 업로드를 시작해요
    git.upload_file();
}

// 문서가 클릭되었을 때 아래 이벤트리스너가 동작해요
document.addEventListener('click', async (event) => {

    // 클릭한 버튼을 식별하기 위한 변수에요
    const clickedElement = event.target;
    const dataE2ELocator = clickedElement.getAttribute('data-e2e-locator');
    
    // 누른 버튼이 제출 버튼이 아니라면 넘어 가요
    if (!dataE2ELocator == "console-submit-button") return

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
    let code = find_raw_code();

    // 채점을 몇초동안 할 것인지를 정하는 변수에요
    // cycle이 0이 되어도 채점이 끝나지 않았다면 오류라고 생각할게요
    let cycle = 60;

    //반복을 시작해요
    let find_submit_list = setInterval(() => {

        // 체점 이 끝나면 아래 요소가 자동으로 생성되요
        let console_div = document.querySelector('[data-e2e-locator="console-console-button"]');

        // console_div가 생겼다는 것은 체점이 끝났다는걸 의미해요
        // 찾지 못했다면 찾는 과정을 반복해요
        if (console_div == null) return 

        // 찾았다면 반복을 중지해요
        clearInterval(find_submit_list);

        // 1.5초의 시간을 두고(체점이 완료되었다고 파싱할 데이터가 모두 생성된건 아닐 수 있어요)
        // 데이터 파싱 및 깃허브 푸쉬를 시작해요 
        setTimeout(async () => {

            // 데이터 파싱해서 변수에 할당해요
            let data = parsing_process()

            // 위 함수에서 파싱하지 못했던 코드도 파싱할게요
            data["code"] = code;
            console.log(data.code);

            // 만약 찾은 데이터가 없다면 작업을 중단해요
            if (data == 0) return;

            // 깃허브 푸쉬를 시작해요
            upload_process(data, token);
        }, 1500)
    }, 1000)
})



