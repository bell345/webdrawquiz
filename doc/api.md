# API Documentation

Base URL - /api/v1

## Creation

POST /create

To server (unauthenticated):

    {
        "title": string,
        "questions": [{
            "question": string,
            "answer": string,
            "valid_responses": string,
            "time_limit": integer,
            "score": integer
        }]
    }

To client:

    {
        "host_sid": string,
        "quiz_code": integer
    }

## Join

POST /join

To server from contestant (unauthenticated):

    {
        "quiz_code": integer,
        "name": string
    }

To client from server:

    {
        "contestant_sid": string
    }

Errors:
 * "invalid_client"
    * The name has already been taken.
    * The quiz code does not exist or has been expired.

## Game
When the quiz has been created, the host initiates an authenticated WebSocket connection to the server.
Each contestant also initiates an authenticated WebSocket connection to the server.
The server acts as a broadcaster - it sends host transmissions to every contestant.
Contestants submit their responses through the WebSocket connection.
The following is a description of the WebSocket API.

WebSocket connections are initiated at:

    /api/v1/ws/host for hosts
    /api/v1/ws/contestant for contestants

All messages (including errors) take the form:

    {
        "id": string,
        "type": string
    }

Errors take the additional form:

    {
        "type": "error",
        "error_type": string,
        "error_description": string
    }

### type: "host_auth" and "contestant_auth"

To server:

    {
        "token": string
    }

To client:

    {
        "authenticated": true
    }

### type: "contestant"

This message is sent between the host and the contestants regularly to synchronise player statuses.

"status" is one of "connected", "disconnected".

To host from server:

    {
        "status": string,
        "contestant_id": string,
        "contestant_name": string,
        "score": integer
    }

### type: "start"

To server from host:
    
    {}

To host from server:

    {
        "title": string
    }

To contestant from server:

    {
        "title": string,
        "contestant_id": string
    }

### type: "response"

Response messages are sent in response to a particular "question" message.

To server from contestant:

    {
        "question_id": string,
        "response_type": string,
        "response_data": string
    }

To host from server:

    {
        "response_id"; string,
        "response_type": string,
        "response_data": string,
        "contestant_id": string,
        "correct": boolean,
        "bonus": integer
    }

To contestant from server:

    {
        "question_id": string,
        "response_id": string
    }

Errors:
 * "invalid_question"
    * This can be the result of the question timing out, after which no more responses can be sent.
 * "invalid_client"
    * If the "response_type" is invalid.
    * If the "response_data" is invalid for the specified type.

### type: "evaluate"

This message is sent to the server by the host to affirm whether or not the latest response
by a contestant is correct. The host can optionally choose to award an arbitrary positive integer amount
of bonus points for particularly good answers. The contestant is not notified until the round is over.

To server from host:

    {
        "response_id": string,
        "correct": boolean,
        "bonus": integer
    }

### type: "question"

"timeout" is a UNIX timestamp denoting when no more responses can be submitted.

To host from server:

    {
        "question_id": string,
        "question": string,
        "answer": string,
        "timeout": integer,
        "score": integer
    }

To contestant from server:

    {
        "question_id": string,
        "question": string,
        "timeout": integer,
        "score": integer
    }

### type: "answer"

This message is sent when the time for answering the question has concluded.
The host can send this prematurely. If so, the contestants must treat it as if
the "timeout" had expired.

To server from host:

    {}

To host from server:

    {
        "question_id": string
    }

To contestant from server:

    {
        "question_id": string,
        "question": string,
        "answer": string,
        "correct": boolean,
        "score": integer
    }

### type: "conclusion"

To server from host:

    {}

To contestant from server:

    {
        "winner_id": string
    }

### type: "close"

This message closes the connection of one or all of the contestants.

A "contestant_id" value of `null` closes the connection for all contestants.

To server from host:

    {
        "contestant_id": string,
        "reason": string
    }

To contestant from server:

    {
        "reason": string
    }
