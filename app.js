const express = require('express');
const bodyParser = require('body-parser');
const graphqlhttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Event = require('./models/event');
const User = require('./models/user');

const app = express();


app.use(bodyParser.json());

app.use('/graphql', graphqlhttp({
    schema: buildSchema(
        `type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!
        }

        type User {
            _id: ID!
            firstName: String!
            lastName: String!
            email: String!
            password: String
            phone: Int!
            createdEvents: [Event!]
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            firstName: String!
            lastName: String!
            email: String!
            password: String!
            phone: Int!

        }
        
        type RootQuery {
            events: [Event!]!
        }
        
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }`
    ),
    // resolver functions
    rootValue: {
        events: () => {
            // can pass filter in future w/reg mongo query language
            return Event.find()
                .populate('creator')
                .then(events => {
                    return events.map(event => {
                        return { 
                            ...event._doc, 
                            _id: event._doc._id.toString(),  // <- this spread operator takes _doc from mongo and this allows the info to be returned without the noisy metadata
                            creator: {
                                ...event._doc.creator._doc,
                                _id: event._doc.creator.id
                            }
                         }; 
                    })
                }
                ).catch(err => {
                    throw err;
                })
        },
        createEvent: (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '5c2bac45eff94542f96aa91b'
            });
            let createdEvent;
            return event
                .save()
                .then(result => {
                    createdEvent = { ...result._doc, _id: event._doc._id.toString() };
                    return User.findById('5c2bac45eff94542f96aa91b')
                })
                .then(user => {
                    if (!user) {
                        throw new Error('User not found.');
                    }
                    user.createdEvents.push(event);
                    return user.save();
                })
                .then(result => {
                    console.log(result);           // below: this whole big toString() thing can also be accomplished with event.id, a native mongo thing (note lack of underscore here)
                    return createdEvent;
                })
                .catch(err => {
                    console.log(err);
                    throw err;
                });
        },
        createUser: args => {
            return User.findOne({ email: args.userInput.email }).then(user => {
                if (user) {
                    throw new Error("User already exists.")
                }
                return bcrypt.hash(args.userInput.password, 12)
            })
                .then(hashedPassword => {
                    const user = new User({
                        firstName: args.userInput.firstName,
                        lastName: args.userInput.lastName,
                        email: args.userInput.email,
                        password: hashedPassword,
                        phone: args.userInput.phone
                    });
                    return user.save();
                })
                .then(result => {
                    return { ...result._doc, password: null, _id: result.id };
                })
                .catch(err => {
                    throw err;
                });

        }
    }, // resolver functions need to match schema endpoints by name
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD
    }@flustered-and-clustered-sfvp7.mongodb.net/${process.env.MONGO_DB
    }?retryWrites=true`
).then(() => {
    app.listen(3030);
}).catch(err => {
    console.log(err);
});



