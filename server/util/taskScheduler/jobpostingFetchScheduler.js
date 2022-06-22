
const logger = require('../../config/logger')

const {pullJobPostings} = require('../../controllers/jobPostingFetcher')
const {jobPostingDataPurge} = require('../../controllers/jobPostingDataPurge')

const {jpProcessQueue} = require('../../config/bullConfig')

// TODO : for now I am thinking breaking down each query in producer
// is not going to improve as RapidAPI server itself is very high latency 
// and will return error in case of short interval of incoming queries

// producer : it should be defined in worker.js process later in production
// for now below code should be placed in server.js for testing
async function registerJPProcess()
{
    
    logger.info(`[Bull jpProcessQueue] registered! `)
    await jpProcessQueue.obliterate({force : true})
    jpProcessQueue.add({ jobprocess : 'start' } , {repeat:
        {
            cron : '08 11 * * *'
        }
    })
}

// consumer
jpProcessQueue.process( async(job) => {
    logger.info(`[Bull jpProcessQueue] : ${JSON.stringify(job)}`)
    
    await pullJobPostings().then( async()=>{
        await jobPostingDataPurge()
    })
    .then((data)=> {
        logger.info(`[Bull jpProcessQueue] Done! : ${data}`)
        
    })

})

// TODO: JOBPOSTING  process functions is not well fit for bull function 
// as I have to break down each query one by one and feed into producer
jpProcessQueue.on('completed', function (job, result) {
    // A job successfully completed with a `result`.
    logger.info(`[Bull jpProcessQueue] complete event : ${JSON.stringify(job)}, ${result}`)
})

module.exports = {registerJPProcess};