import React from 'react'
import UploadImages from './components/UploadImages'
import CardUploader from './components/CardUploader'
import BusinessCardExtractor from './components/BusinessCardExtractor'
import ExcelHistory from './screens/ExcelHistory'
import InstallPrompt from './components/InstallPrompt'

const App = () => {
  return (
    <div>
      <h1 className='text-3xl font-bold underline text-center mt-10'>
        Welcome to P2E App
      </h1>
      
     <div className='text-center mt-5'>
      <CardUploader />
            <InstallPrompt />

      {/* <BusinessCardExtractor /> */}
     </div>
    </div>
  )
}

export default App