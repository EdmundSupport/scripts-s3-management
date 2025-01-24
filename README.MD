# Install
## prerequisites

install [nodejs](https://nodejs.org/en)

## clone project

```
git clone https://github.com/EdmundSupport/scripts-s3-management.git
```

## install dependencies

```
npm i
```

## How to use

- node . list-folder [bucketName] [prefix]
  * Example: list-folder my-bucket my-folder/

- node . list-files [bucketName] [prefix]
  * Example: list-folder my-bucket my-folder/

- node . download [bucketName] [prefix]
  * download my-bucket my-folder/my-file.txt
  
- node . create [bucketName]
  * create my-bucket

- node . create-folder [bucketName] [prefix]
  * create-folder my-bucket my-folder

- node . copy-file [sourceBucket] [sourceKey] [destBucket] [destKey]
  * copy-file my-bucket source-folder/file.txt my-bucket dest-folder/file.txt

- node . copy-folder [sourceBucket] [sourceFolder] [destBucket] [destFolder]
  * copy-folder my-bucket source-folder/ my-bucket dest-folder/

- node . upload-file [bucketName] [originUrl], [prefix]
  * upload-file my-bucket /path/to/file.txt my-folder/
