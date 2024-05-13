const {GraphQLError}  = require('graphql');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET;
const expiration = process.env.JWT_EXPIRY;

module.exports = {
    authMiddleware: function ({req}){
        let token = req.body.token||req.query.token||req.headers.authorisation;

        if(req.headers.authorisation){
            token = token.split(' ').pop().trim();
        }

        if(!token){
            return req;
        }

        try {
            const {data} = jwt.verify(token, secret, {maxAge:expiration});
            req.user = data;
        } catch (error) {
            console.log('invalid token');
        }
    return req;
    },

    AuthenticatorError: new GraphQLError('Could not authenticate user',{
        extentions: {
            code: 'UNAUTHENTICATED',
        },
    }),

    signToken: function ({email, firstName, lastName, _ID})
    {
        const payload = {email,firstName,lastName,_ID};
        return jwt.sign({data:payload}, secret, {expiresIn: expiration});
    }
}
