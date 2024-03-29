import React, {useState}from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JobPage } from './page/JobPage';
// import { BlogPage } from './page/BlogPage';
// import { PartnersPage } from './page/PartnersPage';
// import { CompanyPage } from './page/CompanyPage';
// import { CompanyListPage } from './page/CompanyListPage';
import { Navbar } from './component/Navbar';
// import { CompaniesSectionPage } from './page/CompaniesSectionPage';
// import { BenefitPage } from './page/BenefitPage'

import logo from './images/dwindleTMbigfinal.png'
import burgerMenu from './images/icons8-menu.svg'

import './App.css'
import MobileNav from './component/MobileNav'

function App() {
  const [open, setOpen] = useState(false)

  return (
    <div className='site-container'>
      <BrowserRouter>
        {/* <div className='title-bar'>
          <a href="/" className='logo-image-container'><img src={logo} alt="dwindle logo" /></a> 
          <button><a href='https://dwindlestudentdebt.com/add-company/'>Add a Company</a></button>
        </div> */}

        <div className='page-container'>
          <div className="nav-title-container">
            <div className='title-bar'>
              <a href="/" className='logo-image-container'><img src={logo} alt="dwindle logo" /></a> 
              <button><a href='https://dwindlestudentdebt.com/add-company/'>Add Company</a></button>

              <div className="burger-menu" onClick={() => setOpen(!open)}><img src={burgerMenu} alt='' /></div>

            </div>

            
          </div>            
          <Navbar />
          <MobileNav open={open}/>
          <Routes>
            <Route path="/" element={<JobPage />} />
            {/* <Route path="/blog" element={<BlogPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path='/companies' element={<CompaniesSectionPage />} />
            <Route path='/benefit' element={<BenefitPage />} />
            <Route path="/companies/benefits" element ={<CompanyListPage />} />
            <Route path="/companies/benefits/:name" element={<CompanyPage />} /> */}
          </Routes>

        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
