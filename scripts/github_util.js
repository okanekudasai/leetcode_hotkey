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
    }

    /**
     * 날짜를 만들어주는 함수에요
     * @param {*} date 
     * @returns {String} 날짜
     */
    make_today = (date) => {
        return date.year + "/" + date.month + "/" + date.day;
    }

    /**
     * 시간을 만들어주는 함수에요
     * @param {*} date 
     * @returns {String} 시간
     */
    make_time = (date) => {
        return date.hour + ":" + date.minute + "/" + date.second;
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
     * @returns {String} 기본브랜치 명
     */
    find_default_branch = async (owner, repo) => {

        // 레포지토리 정보를 가져오기 위한 api의 주소에요
        const defaultBranchUrl = `https://api.github.com/repos/${owner}/${repo}`

        const repoResponse = await fetch(defaultBranchUrl, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });

        if (!repoResponse.ok) {
            const errorMessage = await repoResponse.text();
            throw new Error(`Error getting repository details: ${errorMessage}`);
        }

        const repoData = await repoResponse.json();

        let defaultBranch = repoData.default_branch;
        return defaultBranch
    }

    /**
     * 해당 브런치의 마지막 커밋의 해쉬값을 찾는 함수에요
     * @returns {String} 해쉬값
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

        // 실패했는지 판단해요
        if (!branchResponse.ok) {
            const errorMessage = await branchResponse.text();
            throw new Error(`Error getting branch details: ${errorMessage}`);
        }

        const branchData = await branchResponse.json();
        let currentCommitSha = branchData.object.sha;
        return currentCommitSha
    }

    /**
     * 이함수를 사용해 베이스 트리의 해쉬값을 찾아요
     * @return {String} 해쉬값
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

        // 실패했는지 판단해요
        if (!branchResponse.ok) {
            const errorMessage = await branchResponse.text();
            throw new Error(`Error getting branch details: ${errorMessage}`);
        }

        const baseTreeData = await branchResponse.json();
        return baseTreeData.sha
    }

    /**
     * 새로운 트리를 만들고 해쉬값을 얻기 위한 함수에요
     * @return {String} 해쉬값
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

        return new_tree_sha.sha;
    }

    /**
     * 정말 커밋이 수행이 되는 함수에요
     * @return {String} 해쉬값
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

        // 저장소에서 레포지터리 명을 가져와요
        let repo = await new Promise((resolve, reject) => {
            chrome.storage.local.get("basic_directory", result => {
                resolve(result["basic_directory"]);
            })
        })

        // 기본브랜치를 찾아요
        let default_branch = await this.find_default_branch(this.username.login, repo);

        // 기본 브랜치의 마지막 커밋의 해쉬값을 찾아요
        let last_commit_sha = await this.find_last_commit_sha(this.username.login, default_branch, repo);

        // 찾은 해쉬값을 이용해 베이스 트리의 해쉬값을 찾아요
        let base_tree_sha = await this.find_base_tree_sha(this.username.login, repo, last_commit_sha);

        // 베이스 트리에 커밋하고자 하는 파일을 적어요
        let new_tree_sha = await this.make_new_tree_sha(this.username.login, repo, base_tree_sha);

        // 정말 커밋이 이루어져요. 새로운 커밋의 해쉬값을 얻어요
        let new_commit_sha = await this.make_new_commit_sha(this.username.login, repo, last_commit_sha, new_tree_sha);

        // 푸쉬가 이루어 져요
        let push_result = await this.make_git_push(this.username.login, repo, new_commit_sha, default_branch)
    }
}