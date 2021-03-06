const { GraphQLScalarType } = require('graphql')
const fetch = require('node-fetch')
const { authorizeWithGithub } = require('../lib')

module.exports = {
    Query: {
        totalPhotos: (parent, args, { db }) =>
            db.collection('photos')
                .estimatedDocumentCount(),
        allPhotos: (parent, args, { db }) =>
            db.collection('photos')
                .find()
                .toArray(),
        totalUsers: (parent, args, { db }) =>
            db.query('SELECT COUNT(*) FROM users', {raw: true})
                .then(function(data){
                    data;
                }, function(err){
                    throw err;
                }),
        allUsers: (parent, args, { db }) =>
            db.collection('users')
                .find()
                .toArray(),
        me: (parent, args, { currentUser }) => currentUser
    },

    Mutation: {
        async postPhoto(parent, args, { db, currentUser }) {
            // 1. If there is not a user in context, throw an error
            if (!currentUser) {
                throw new Error('only an authorized user can post a photo')
            }
            // 2. Save the current user's id with the photo
            const newPhoto = {
                ...args.input,
                userID: currentUser.githubLogin,
                created: new Date()
            }
            // 3. Insert the new photo, capture the id that the database created
            const { insertedIds } = await db.collection('photos').insertOne(newPhoto)
            newPhoto.id = insertedIds[0]
            return newPhoto
        },

        async githubAuth(parent, { code }, { db }) {
            // 1. Obtain data from GitHub
              let {
                message,
                access_token,
                avatar_url,
                login,
                name
              } = await authorizeWithGithub({
                client_id: '?',
                client_secret: '?',
                code
              })
            // 2. If there is a message, something went wrong
              if (message) {
                throw new Error(message)
              }
            // 3. Package the results into a single object
            let latestUserInfo = {
                name,
                githubLogin: login,
                githubToken: access_token,
                avatar: avatar_url
            }
            // 4. Add or update the record with the new information
            const { ops:[user] } = await db
                .collection('users')
                .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true })
            // 5. Return user data and their token
            return { user, token: access_token }
        },

        addFakeUsers: async (root, {count}, {db}) => {
            var randomUserApi = `https://randomuser.me/api/?results=${count}`
            var { results } = await fetch(randomUserApi)
              .then(res => res.json())
            var users = results.map(r => ({
              githubLogin: r.login.username,
              name: `${r.name.first} ${r.name.last}`,
              avatar: r.picture.thumbnail,
              githubToken: r.login.sha1
            }))
            await db.collection('users').insertMany(users)
            return users
        },

        async fakeUserAuth (parent, { githubLogin }, { db }) {
            var user = await db.collection('users').findOne({ githubLogin })
            if (!user) {
                throw new Error(`Cannot find user with githubLogin "${githubLogin}"`)
            }
            return {
                token: user.githubToken,
                user
            }
        }
    },

    Photo: {
        id: parent => parent.id || parent._id,
        url: parent => `/img/photos/${parent._id}.jpg`,
        postedBy: (parent, args, { db }) =>
          db.collection('users').findOne({ githubLogin: parent.userID })
    },

    User: {
        postedPhotos: parent => {
            return photos.filter(p => p.githubUser === parent.githubLogin)
        },

        inPhotos: parent => tags
            .filter(tag => tag.userID === parent.id)
            .map(tag => tag.photoID)
            .map(photoID => photos.find(p => p.id === photoID))
    },

    DateTime: new GraphQLScalarType({
        name: 'DateTime',
        description: 'A valid date time value.',
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseLiteral: ast => ast.value
    })
}

var _id = 0
var users = [
    { "githubLogin": "mHattrup", "name": "Mike Hattrup" },
    { "githubLogin": "gPlake", "name": "Glen Plake" },
    { "githubLogin": "sSchmidt", "name": "Scot Schmidt" }
]

var photos = [
    {
      "id": "1",
      "name": "Dropping the Heart Chute",
      "description": "The heart chute is one of my favorite chutes",
      "category": "ACTION",
      "githubUser": "gPlake",
      "created": "3-28-1977"
    },
    {
      "id": "2",
      "name": "Enjoying the sunshine",
      "category": "SELFIE",
      "githubUser": "sSchmidt",
      "created": "1-2-1985"
    },
    {
      id: "3",
      "name": "Gunbarrel 25",
      "description": "25 laps on gunbarrel today",
      "category": "LANDSCAPE",
      "githubUser": "sSchmidt",
      "created": "2018-04-15T19:09:57.308Z"
    }
]

var tags = [
    { "photoID": "1", "userID": "gPlake" },
    { "photoID": "2", "userID": "sSchmidt" },
    { "photoID": "2", "userID": "mHattrup" },
    { "photoID": "2", "userID": "gPlake" }
]
