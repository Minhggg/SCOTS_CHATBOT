"use client"

import * as React from "react"

// --- Utility Function ---
type ClassValue = string | number | boolean | null | undefined
function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ")
}

// --- Icons ---
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5V19" />
    <path d="M5 12H19" />
  </svg>
)

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5.25L12 18.75" />
    <path d="M18.75 12L12 5.25L5.25 12" />
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// --- Custom Components ---
const SimpleTooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <span className="absolute -top-8 scale-0 transition-all rounded bg-gray-900 dark:bg-gray-100 px-2 py-1 text-xs text-white dark:text-gray-900 opacity-0 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
        {text}
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></span>
      </span>
    </div>
  )
}

// --- Interface Props Mới ---
interface PromptBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Nhận ảnh từ component cha
  imageSrc?: string | null; 
  // Hàm báo cho cha biết khi người dùng chọn/xóa ảnh
  onImageChange?: (file: File | null, previewUrl: string | null) => void;
}

// --- Main Component ---
export const PromptBox = React.forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  ({ className, imageSrc, onImageChange, ...props }, ref) => {
    const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    
    // State Modal xem ảnh full (Cái này UI nội bộ nên giữ ở đây ok)
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    // Merge refs
    React.useImperativeHandle(ref, () => internalTextareaRef.current!, [])

    // Auto-resize textarea
    React.useLayoutEffect(() => {
      const textarea = internalTextareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.min(textarea.scrollHeight, 200)
        textarea.style.height = `${newHeight}px`
      }
    }, [props.value]) // Resize khi value thay đổi

    const handlePlusClick = () => {
      fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          // Báo lên cha: "Tao vừa chọn file này, url preview là này"
          if (onImageChange) {
            onImageChange(file, reader.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
      event.target.value = "" // Reset input file
    }

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      setIsModalOpen(false)
      // Báo lên cha: "Xóa ảnh đi"
      if (onImageChange) {
        onImageChange(null, null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    // Kiểm tra xem có nội dung không (text hoặc ảnh) để enable nút Gửi
    const hasValue = (props.value && props.value.toString().trim().length > 0) || imageSrc

    return (
      <>
        {/* Modal xem ảnh full */}
        {isModalOpen && imageSrc && (
           <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
               <button onClick={() => setIsModalOpen(false)} className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors">
                 <XIcon className="h-6 w-6" />
               </button>
               <img src={imageSrc} alt="Preview Full" className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"/>
               <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 -z-10 cursor-pointer" />
             </div>
           </div>
        )}

        <div
          className={cn(
            "flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-white border dark:bg-[#303030] dark:border-transparent cursor-text w-full mx-auto",
            className,
          )}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          {/* Hiển thị ảnh Preview (Dựa trên props imageSrc truyền từ cha) */}
          {imageSrc && (
            <div className="relative mb-1 w-fit rounded-[1rem] px-1 pt-1 group">
              <button 
                type="button" 
                className="transition-transform active:scale-95" 
                onClick={() => setIsModalOpen(true)}
              >
                <img
                  src={imageSrc}
                  alt="Preview"
                  className="h-14 w-14 rounded-[1rem] object-cover border border-gray-200 dark:border-gray-600"
                />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-200 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          )}

          <textarea
            ref={internalTextareaRef}
            rows={1}
            placeholder="Message..."
            className="custom-scrollbar w-full resize-none border-0 bg-transparent p-3 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus:ring-0 focus-visible:outline-none min-h-[48px]"
            {...props} // Nhận toàn bộ props (value, onChange, onKeyDown...)
          />

          <div className="mt-1 flex items-center justify-between p-1 pt-0">
            <SimpleTooltip text="Attach image">
              <button
                type="button"
                onClick={handlePlusClick}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-[#515151]"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </SimpleTooltip>

            <SimpleTooltip text="Send">
              <button
                type="submit"
                disabled={!hasValue}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:bg-gray-200 dark:disabled:bg-[#515151] disabled:text-gray-400"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </SimpleTooltip>
          </div>
        </div>
      </>
    )
  },
)
PromptBox.displayName = "PromptBox"