## Live streaming of Fauna documents

This project is an example project that uses the **document streaming features** of Fauna. It's a simple React application that shows how to retrieve a page of references from a Fauna collection and open streams on the documents that are currently present on the screen. It will display the incoming versions of the currently loaded documents and update the documents live.

![alt text](https://github.com/fauna-brecht/fauna-streaming-example/blob/main/public/example.png?raw=true)

Many use cases could be built upon document streaming:

* Live dashboard (e.g. elections, disease tracking, stock trading)
* Web pages that update their data live as changes come in (e.g. the amount of stock on a shop item that a user is watching)
* Live-updating multiplayer games that require storage for each move (e.g. games like Pokemon Go)

### Setup

#### Setup a collection and Fauna keys

There is an environment variables .example file provided which shows the necessary configuration. Copy the **.env.example** file to a **.env** file and fill in the following variables.

```
REACT_APP_FAUNA_COLLECTION=some-collection-name-you-pick
REACT_APP_FAUNA_KEY=your-fauna-key-that-has-access-to-that-collection
FAUNADB_ADMIN_KEY=admin-key-for-the-scripts
```

- **REACT_APP_FAUNA_COLLECTION**: the collection that will be streamed to the frontend.  Go to the fauna dashboard (https://dashboard.fauna.com/) and make a new database with one collection which you will use for the application. Fill in the name of the collection here. 
- **REACT_APP_FAUNA_KEY**: a Fauna key to be used by the frontend to retrieve data and open the streams. To create such a key, go to the fauna dashboard (https://dashboard.fauna.com/) and create a key in the security tab. This key will be exposed in the frontend, although you could use a server key here to quickly test it out, do not use such a key in production. Ideally, make a new role that only has access to the collection you will use. 
- **FAUNADB_ADMIN_KEY**: this key will be used for two scripts that are provided to generate some data and modify the data to see streaming in action. This data will be created in the collection you provided above. This key will not be exposed to the frontend. You also have the option not to store it in the .env file and fill it in when the script asks for it. 

There are two optional variables provided which you can either leave as they are or fill in to connect to your local docker environment. 

```
REACT_APP_FAUNA_DOMAIN=db.fauna.com
REACT_APP_FAUNA_SCHEME=https
```

#### Setup the frontend

Clone the repository and run

```
npm install
```

to install the libraries.

#### Start the frontend

Start the frontend:  

```
npm run start
```

### Generate some data

Documents that exist at the moment the application starts become visible in the application. New documents are currently not included since that makes little sense in combination with pagination. For each of the documents that are visible on the page, live updates will arrive. 

You can either create some documents yourself, launch the frontend and start editing the documents or you can run the scripts to create and update some shop items.

The following script will create 50 documents by default

```
pm run populate-shop   
```

This script will each time take 20 documents at random and update the stock **available** and **price** of the shopping item.

```
npm run update-shop-loop
```

You should see the items come in live when the script runs. 
