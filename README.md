fh-rest-mongodb-adapter
=======================

A MongoDB adapater compatible with the _fh-rest-express-router_. Allows one to
easily create a RESTful API that uses MongoDB as a datastore.

## Example

The code below will generate routes that can be used [like this](https://github.com/feedhenry-staff/fh-rest-express-router#restful-api-definition)

```js
'use strict';

var app = require('express')()
  , fhRestRouter = require('fh-rest-express-router')
  , fhRestMongoAdapter = require('fh-rest-mongodb-adapter');

app.use(
  '/tasks',
  fhRestMongoAdapter({
    // Collection to expose
    collection: 'user-tasks',

    // Optional mongo connection string. When on RHMAP this is filled for you
    mongoUrl: 'mongodb://host-name.com/27017/database-name',

    // Indexes you'd like to apply to collections in use
    indexes: [{
      userId: 1
    }]
  })
);

app.listen(3001);
```

## Direct API
Works just like the [memory adapter](https://github.com/feedhenry-staff/fh-rest-memory-adapter#direct-api),
with the exception being _params.query_ passed to _adapter.list_ can contain
Mongo specific operators, e.g $gte. For example:

```js
var payloads = fhRestMongoAdapter({
  // Collection to expose
  collection: 'payloads'
});

payloads.list({
  query: {
    createDate: {
      $lte: new Date()
    }
  }
}, function (err, payloads) {});
```

### getJoiValidator()
Returns a Joi schema that can be passed in _opts.validations_ to
*fh-rest-express-router* to prevent use of $where to prevent NoSQL injection.
