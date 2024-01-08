let hot_key = [];

/**
 * 핫키를 팝업창에 표시하기 위한 함수에요 팝업 시작과 동시에 시작되요
 */
init = () => {
    chrome.storage.local.get("hot_key", function (result) {
        hot_key = result["hot_key"].split("+");
    });
}

// 핫키를 표시해요
init();

// 현재 키포드에 눌려진 키를 담는 배열이에요
let pressed_key = [];
document.addEventListener('keydown', function (event) {

    // 눌린 키를 배열에 담아요
    pressed_key.push(event.code)

    // 핫키 배열을 돌며 하나라도 눌린키에 안들어 있다면 동작을 중지해요 
    let flag = true;
    for (let i of hot_key) {
        if (!pressed_key.includes(i)) {
            flag = false;
            break;
        }
    }

    // 모든 키가 눌렸다면 각 content script에 run_button_click을 작동시켜요
    if (flag) {
        run_button_click();
    }
})

// 키가 떼지면 pressed_key에서 제거해요
document.addEventListener('keyup', function (event) {
    let elementToRemove = event.code; // 제거할 요소 값
    let indexToRemove = pressed_key.indexOf(elementToRemove);

    if (indexToRemove !== -1) {
        pressed_key.splice(indexToRemove, 1);
    }
})


/**
 * 오늘에 대한 정보를 받아와요
 * @returns {object} 년,월,일,시,분,초에 대한 정보가 담긴 객체에요
 */
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
        chrome.storage.local.set({ "token": undefined });
        chrome.storage.local.set({ "username": undefined });
        return 0;
    }
}
