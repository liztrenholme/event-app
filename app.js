const express = require('express');
const bodyParser = require('body-parser');
const graphqlhttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const events = []; //this is temporary and will replaced by the actual database


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
            return events;
        },
        createEvent: (args) => {
            const event = {
                _id: Math.random().toString(), // temporary, will be replaced by db making unique ids
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: args.eventInput.date
            }
            events.push(event);
            return event;
        }
    }, // resolver functions need to match schema endpoints by name
    graphiql: true
}));

app.listen(3030);

