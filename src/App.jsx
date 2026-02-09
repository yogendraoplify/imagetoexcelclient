import React from 'react'
import UploadImages from './components/UploadImages'
import CardUploader from './components/CardUploader'
import BusinessCardExtractor from './components/BusinessCardExtractor'
import ExcelHistory from './screens/ExcelHistory'

const App = () => {
  return (
    <div>
      <h1 className='text-3xl font-bold underline text-center mt-10'>
        Welcome to P2E App
      </h1>
      <nav className='flex justify-center gap-4 mt-5'>
        <a href="/upload" className='text-blue-600 underline'>Upload</a>
        <a href="/history" className='text-blue-600 underline'>History</a>
      </nav>
     <div className='text-center mt-5'>
      <CardUploader />
      <ExcelHistory />
      {/* <BusinessCardExtractor /> */}
     </div>
    </div>
  )
}

export default App