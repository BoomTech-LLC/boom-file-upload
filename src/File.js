import React, { useRef, useEffect, useState } from 'react'
import List from './Components/List'
import UploadService from './Services/FileUpload'

const FileUpload = ({
  inputContent,
  url,
  isMultiple,
  onChange,
  onRemove,
  classprefix,
  getFiles,
  getErrors,
  initialValue,
  autoUpload,
  getResult,
  headers,
  dropbox,
  ...props
}) => {
  const [state, setState] = useState({})
  const [value, setValue] = useState(initialValue || [])
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (getFiles) getFiles(value)
  }, [value])

  const handleRemove = (id) => {
    if (onRemove) onRemove(id)
    setValue(value.filter((item) => item.id !== id))
  }

  const handleUpload = async (files) => {
    const custommFiles = []

    for (let i = 0; i < files.length; i++) {
      custommFiles.push(
        new File(
          [files[i]],
          `${files[i].name
            .normalize('NFC')
            .replace(
              '.' + files[i].name.normalize('NFC').split('.').pop(),
              ''
            )}_${Math.random().toString(36).substr(2, 4)}.${files[i].name
            .normalize('NFC')
            .split('.')
            .pop()}`,
          { type: files[i].type }
        )
      )
    }

    Object.keys(custommFiles).map((item, i) => {
      custommFiles[item].id = `${new Date().getTime()}-${i}`
    })

    setValue(
      value ? [...value, ...Array.from(custommFiles)] : Array.from(custommFiles)
    )
    if (autoUpload) for (const file of custommFiles) await upload(file)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleUpload(files)
  }

  // Move this to another file
  const upload = async (file) => {
    const promise = new Promise((resolve, reject) => {
      return UploadService.upload({ file, url, headers, dropbox }, (event) => {
        const percent = Math.round((100 * event.loaded) / event.total)
        file.percent = percent
        setState({ ...state, [file.id]: percent })
      })
        .then((result) => {
          resolve(result)
        })
        .catch((error) => {
          file.percent = 0
          setState({ ...state, [file.id]: 0 })
          if (getErrors) getErrors(error)
        })
    })

    return promise.then((result) => {
      if (getResult) getResult(result)
      return result
    })
  }

  return (
    <div
      className={`boomFileUpload-file__content${
        classprefix ? ` ${classprefix}-file__content` : ''
      }`}
    >
      {value && (
        <List
          value={value}
          progress={state}
          onRemove={handleRemove}
          classprefix={classprefix}
        />
      )}
      {((!value.length && !isMultiple) || isMultiple) && (
        <div
          className={`boomFileUpload-drop__content${
            classprefix ? ` ${classprefix}-drop__content` : ''
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDragLeave={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div
            className={`boomFileUpload-input__content${
              classprefix ? ` ${classprefix}-drop__message` : ''
            }`}
          >
            {inputContent ||
              `Drag File${isMultiple ? `s` : ``} or Click to Browse`}
          </div>
          <input
            ref={fileInputRef}
            {...props}
            multiple={isMultiple}
            type='file'
            onChange={(e) => {
              const files = e.target.files
              handleUpload(files)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default FileUpload
