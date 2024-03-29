//Disabled as the workflow of email campaign has been changed to 
//update the template with dynamic content 

const {logger} =  require('../../config/logger')
const {emailCampaignCreateQueue} = require('../../config/bullConfig')

const { weeklyCampaignCreate} = require('../../service/weeklyEmailCampaignCreateAndUpdate')
require('dotenv').config();

const { NODE_ENV } = process.env;

const cronOpt = (() => {
    if(NODE_ENV === 'test' || NODE_ENV === 'development')
    {
        return { cron : '49 * * * *'};
    }
    else{
        // At 03:00 a.m on Monday.
        return { cron : '00 03 * * 1'};
    }
})();


async function registerCampaignCreateService()
{
    logger.info(`[Bull campaignCreateScheduler] registered! `);
    await emailCampaignCreateQueue.obliterate({force : true});

    // “At 10:00 on Saturday and Sunday.”
    emailCampaignCreateQueue.add({ message : 'campaignCreateScheduler processing' } , {repeat: cronOpt });
}


emailCampaignCreateQueue.process(async(job) => {
    
    logger.info(`[Bull campaignCreateScheduler] Consumer: job info : ${JSON.stringify(job.data.message)}`);
    await weeklyCampaignCreate().then((msg) =>
    {
        logger.info(`[Bull campaignCreateScheduler] Consumer done processing! : ${msg}`);
    }).catch((error) => {
        logger.error(`[Bull campaignCreateScheduler] Consumer error : ${error}`);
    }); 
   

});


module.exports = {registerCampaignCreateService}