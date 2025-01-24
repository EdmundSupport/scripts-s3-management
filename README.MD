# Install
## prerequisites

install [nodejs](https://nodejs.org/en)

## aws config

crete file config
```
nano/vim/code ~/.aws/config 
```

define config
```
[default]
region = 
output = json
```

create file credentials
```
nano/vim/code ~/.aws/credentials
```

define credentials
```
[default]
aws_access_key_id = 
aws_secret_access_key = 
```

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
