import React from 'react'
import { EmailSignUp } from '../component/EmailSignUp'
import { JobPostSearch } from '../component/JobPostSearch'

export const JobPage = () => {
  return (
    <div className='job-page-body'>
        
      <EmailSignUp />
      <JobPostSearch />
        
    </div>
  )
}
