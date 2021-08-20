const fetch = require('node-fetch')

const requestGithubToken = credentials =>
    fetch(
        'https://github.com/login/oauth/access_token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(credentials)
        }
    )
    .then(res => res.json())
    .catch(error => {
      throw new Error(JSON.stringify(error))
    })
    
    // const requestGithubUserAccount = token => 
    //     fetch(`https://api.github.com/user?access_token=${token}`)
    //         .then(res => res.json())
    //         .catch(error => {
    //             throw new Error(JSON.stringify(error))
    //         })
    
    const requestGithubUserAccount = token => 
        fetch('https://api.github.com/user', {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': 'token ' + token,
                'X-FP-API-KEY': 'notebook', //it can be iPhone or your any other attribute
                'Content-Type': 'application/json'
            }

        })
            .then(res => res.json())
            .catch(error => {
                throw new Error(JSON.stringify(error))
            })
    // -H 'Authorization: token my_access_token' https://api.github.com/user/repos
    
const authorizeWithGithub = async credentials => {
    const { access_token } = await requestGithubToken(credentials)
    const githubUser = await requestGithubUserAccount(access_token)
    return { ...githubUser, access_token }
    }

// module.exports = {findBy, authorizeWithGithub, generateFakeUsers, uploadFile}
module.exports = {authorizeWithGithub}