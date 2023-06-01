# akto-app

## Description : 
The app, runs a cron job every minute in the code and fetch's data from Github Public Repo and updates as changes reflected on the file.

## How to run the akto-app
1. Clone the project
```shell
git clone 
```

2. Change Directory
```shell
cd akto-app
```

3. Install the dependencies (I use yarn hence)
```shell
yarn install
```

4. Make necessary changes in the `.env.example` file for database connection. (That is provide a Database URL) and importantly rename `.env.example` to `.env`
```
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.ijkiuxr.mongodb.net/<dbname>?retryWrites=true&w=majority"
```
Note : 
    Replace `<username>` with your username.
    Replace `<password>` with your password.
    And Finally replace `<dbname>` with your dbname, you can keep `akto-app`.

I am using Mongodb Atlas, a Tutorial on setup of the Cluster can be found in [here](https://www.mongodb.com/basics/clusters/mongodb-cluster-setup).

5. Start the app, this will call the `start` script in the `package.json`, which 
```
yarn start
``` 

Output:
```
Cron job started successfully.
... After 1 Minute
Data fetched and stored successfully.
... After 1 Minute
Data fetched and stored successfully.
```

If Error:
```
Error fetching and storing data: Error Information
```

## Tech Stack
- MongoDB Atlas
- typescript (Programming Language)
- prisma (Database ORM)
- @octokit/rest (API to interact with GitHub)
- winston (Logger)
- yarn (Package Manager)
