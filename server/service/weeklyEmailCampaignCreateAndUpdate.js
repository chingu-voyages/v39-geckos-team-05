const {logger} = require('../config/logger');
const MCAPI = require('../config/mailChimpAPI');

const {dyanmicConentBuilder} = require('./weeklyEmailDynamicContent');

require('dotenv').config();
const { NODE_ENV } = process.env;

const TEMPLATE_NAME = "dwindle_template";
const AUD_GRP_NAME = "Dwindle Student Debt";

var listID = undefined;
var dwindleTemplateID = undefined;
var campaignID  = [];
var campaignTitle = undefined;

// /https://www.epochconverter.com/weeknumbers
Date.prototype.getWeek = function () {
    var target  = new Date(this.valueOf());
    // getDay => {Monday... Sunday}
    // convert day to be counted from 0 not 1
    var dayNr   = (this.getDay() + 6) % 7;
    // get the firstThursday
    target.setDate(target.getDate() - dayNr + 3);
    var firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() != 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    // 7*24*60*60*1000
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}
// If sleep is too long, it doen't contineue the execution, 
// so Campaign create and update should be separate
async function sleep(ms) {
    logger.info("sleep for 3 mins until the server creates the campaign...")
    return new Promise(resolve => setTimeout(() => resolve, ms));
}

// updateListIDandTemplateID updates Audience Group list ID and Template ID which are required to create a new campaign
async function updateListIDandTemplateID()  {
    try{
        await MCAPI.connectionChecker().then(async(connected)=>{
            if(connected)
            {
                // Audience Group List ID update
                logger.info(`[updateListIDandTemplateID] : MailChimpo Connected `)
                await MCAPI.getAudienceGroup(AUD_GRP_NAME).then((groupinfo) => {
                    // console.log(groupinfo.length)
                    if(groupinfo.length === 0)
                    {   
                        throw Error(`[updateListIDandTemplateID] : getAudienceGroup failed`);
                    }else
                    {
                        logger.info(`[updateListIDandTemplateID] : MailChimpo selected audience group name : ${JSON.stringify(groupinfo[0].name)} `);
                        logger.debug(`[updateListIDandTemplateID] : MailChimpo audience group information : ${JSON.stringify(groupinfo)} `);
                        listID = groupinfo[0].id;
                        logger.info(`[updateListIDandTemplateID] : audience listID updated : ${JSON.stringify(groupinfo[0].id)}`);
                    }
                })
                                   
                // Template ID update
                const templateListOption = {
                    type : 'user',
                    // since_date_created : '',
                }
                await MCAPI.getTemplateListMrkt(TEMPLATE_NAME, templateListOption).then((templateList)=> 
                    {
                        if(templateList.length === 0)
                        {   
                            throw Error(`[updateListIDandTemplateID] : getTemplateListMrkt failed`);
                        }else
                        {
                            logger.info(`[updateListIDandTemplateID] : MailChimpo selected template group name : ${JSON.stringify(templateList[0].name)} `);
                            logger.debug(`[updateListIDandTemplateID] : MailChimpo template group information : ${JSON.stringify(templateList)} `);
                            dwindleTemplateID = templateList[0].id;
                            logger.info(`[updateListIDandTemplateID] : templateID updated : ${JSON.stringify(templateList[0].id)}`);  
                        }                
                    }
                );
                logger.info(`[updateListIDandTemplateID] : Success`)
                return Promise.resolve(`[updateListIDandTemplateID] : Success`);         
            }else{
                return Promise.reject(`[updateListIDandTemplateID] : mailchimp server connection failed`);
            }
        });   
    }catch(err)
    {
        // logger.error(`[MailChimpEmailHandling] updateListIDandTemplateID: error : ${JSON.stringify(err)}`);                  
        return Promise.reject(`[updateListIDandTemplateID] : Error : ${err}`);
    }
}



// this function 
const weeklyCampaignCreate = async() => {
    try{
        await updateListIDandTemplateID().catch((error) => {
            // logger.error(error)
            return Promise.reject(error)
        })
    
        let weekNumber= new Date().getWeek();

        // every 10 mins create and update tempalte
        if(NODE_ENV === 'test' || NODE_ENV === 'development')
        {
            const date = new Date();

            campaignTitle = `Dwindle Weekly News letter week ${weekNumber}_${date.getHours()}`
            logger.info(`[weeklyEmailCampaignCreate] Test weeklyCampaignCreate : This week's campaign name : ${campaignTitle}`);                  
            // See if there is already a campaign created
            await MCAPI.getCampaignList(campaignTitle).then((campaignInfo)=>{
                
                logger.info(`[weeklyEmailCampaignCreate] Test weeklyCampaignCreate:  Is there any campaign already created?  ${campaignInfo.length>0}`);  
                    // console.log(campaignInfo);
                campaignID = campaignInfo;
            });
        }
        else{
            
            campaignTitle = `Dwindle Weekly News letter week ${weekNumber}`
            logger.info(`[weeklyEmailCampaignCreate] weeklyCampaignCreate : This week's campaign name : ${campaignTitle}`);                  
            // See if there is already a campaign created
            await MCAPI.getCampaignList(campaignTitle).then((campaignInfo)=>{
                
                logger.info(`[weeklyEmailCampaignCreate] weeklyCampaignCreate:  Is there any campaign already created?  ${campaignInfo.length>0}`);  
                    // console.log(campaignInfo);
                campaignID = campaignInfo;
            });
        }
        
        // Only when there is no campaign that has same name as campaignTitle, execute createCampaign
        // if there are more than two compaigns have same name as campaignTitle, it will be logged as an error
        // but only update the template of the campaign that comes first in the weeklyCompaign array
        
        if(campaignID.length < 1){
            // TODO: This should be defined by jesse as well
            // Once a certain campaign has been sent to subscrbiers,
            // it becomes uneditable
            const setting = {
                subject_line: campaignTitle, //it will be title of email
                preview_text: "preview",
                title: campaignTitle, //title of campaign / identifier
                template_id: dwindleTemplateID,
                from_name: "The Dwindle Team",
                reply_to: "lbfn83@gmail.com",
                to_name: "", 
                auto_footer: true, //true,
                inline_css: true , //true
            };
            
            // it can create duplicate campaigns with same title
            await MCAPI.createCampaign(listID, setting).then((createdCampaign)=> {
                logger.info(`[weeklyEmailCampaignCreate] weeklyCampaignCreate: New campaign created : ${createdCampaign}`);  
                campaignID.push(createdCampaign.id);
            });
            // // TODO : sleep 3 min since it takes time to mailchimp server to create campaign
            // await sleep(3*60*1000);
           
        }else if(campaignID.length > 1)
        {
            logger.error(`[weeklyEmailCampaignCreate] weeklyCampaignCreate: There are more than two campaigns of  ${campaignTitle}`);    
        }
        else{
            logger.info(`[weeklyEmailCampaignCreate] weeklyCampaignCreate: ${campaignTitle} already Exist, campaign creation skipped`)
        }
          
    }catch(err)
    {
        // logger.error(`[MailChimpEmailHandling] updateListIDandTemplateID: error : ${JSON.stringify(err)}`);                  
        return Promise.reject(`[weeklyEmailCampaignCreate] weeklyCampaignCreate: error : ${err}`);
    }
}


const weeklyCampaignUpdate = async() => {
        // Update TemplateID 
        await updateListIDandTemplateID().catch((error) => {
            return Promise.reject(error)
        })
        let weekNumber= new Date().getWeek();
        // Generate Campaign Title
        if(NODE_ENV === 'test' || NODE_ENV === 'development')
        {
            const date = new Date();

            campaignTitle = `Dwindle Weekly News letter week ${weekNumber}_${date.getHours()}`
            logger.info(`[weeklyCampaignUpdate] Test weeklyCampaignUpdate : This week's campaign name : ${campaignTitle}`);                  
            // See if there is already a campaign created
            await MCAPI.getCampaignList(campaignTitle).then((campaignInfo)=>{
                
                logger.info(`[weeklyCampaignUpdate] Test weeklyCampaignUpdate:  Is there any campaign already created?  ${campaignInfo.length>0}`);  
                    // console.log(campaignInfo);
                campaignID = campaignInfo;
            });
        }
        else{
            
            campaignTitle = `Dwindle Weekly News letter week ${weekNumber}`
            logger.info(`[weeklyCampaignUpdate] weeklyCampaignUpdate : This week's campaign name : ${campaignTitle}`);                  
            // See if there is already a campaign created
            await MCAPI.getCampaignList(campaignTitle).then((campaignInfo)=>{
                
                logger.info(`[weeklyCampaignUpdate] weeklyCampaignUpdate:  Is there any campaign already created?  ${campaignInfo.length>0}`);  
                    // console.log(campaignInfo);
                campaignID = campaignInfo;
            });
        }

        //  Check out the compaign's status and see if it is "save" status 
        const status = await MCAPI.getCampaignStatus(campaignID[0]);
        
        // console.log(await status);
        if( status === 'save')
        {
            // TODO : DB에서 JobData 뽑아오기
            const dynamicContent = await dyanmicConentBuilder();

            // const dynamicContent = `<style>  width: 300px; border: 15px solid green;
            // padding: 50px;
            // margin: 20px; </style>
            // <div class="job-posting"><div class="posting-text-container"><h2>Best Buy</h2><h1> AGENT, AUTOTECH I </h1><div>Northridge, CA | 2022-07-06 </div></div><a href="https://www.linkedin.com/jobs/view/agent-autotech-i-at-best-buy-3151409640" target="_blanck">Apply</a></div>`
            
            const contentOpt = {
                "template": {
                    "id": dwindleTemplateID,
                    "sections": {
                        "mytext": dynamicContent
                    }
                }
            }
            console.log(await campaignID[0]);
            await MCAPI.updateCampaignContent(campaignID[0],contentOpt );
            return Promise.resolve("[weeklyCampaignUpdate]  :success");
        }else
        {
            return Promise.reject(`[weeklyCampaignUpdate]  :campaign status is already "${status}" and it is uneditable`);
        }       
}

module.exports = {  weeklyCampaignCreate, weeklyCampaignUpdate  };

 /* Below two Functions are redundant in our work flow */
        // Response from getCampaignInfo
        // settings: {
            // subject_line: 'test',
            // preview_text: 'preview',
            // title: 'test weekly'}
            // using setting.title as an identifier makes sense to me
            
        // await getCampaignInfo(weeklyCompaign[0].campaign_id);
        // await MCAPI.getCampaignContent(campaignID[0]);

