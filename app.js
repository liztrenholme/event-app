const express = require('express');
const bodyParser = require('body-parser');
const graphqlhttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/event');

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
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        
        type RootQuery {
            events: [Event!]!
        }
        
        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }`
    ),
    rootValue: {
        events: () => {
            // can pass filter in future w/reg mongo query language
            Event.find().then(events => {
                return events.map(event => {
                    return {...event._doc, _id: event._doc._id.toString()}; // <- this spread operator takes _doc from mongo and this allows the info to be returned without the noisy metadata
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
                date: new Date(args.eventInput.date)
            })
            return event.save().then(result => {
                console.log(result);           // below: this whole big toString() thing can also be accomplished with event.id, a native mongo thing (note lack of underscore here)
                return {...result._doc, _id: event._doc._id.toString()};
            }).catch(err => {
                console.log(err);
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



