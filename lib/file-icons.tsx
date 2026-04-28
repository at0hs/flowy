import {
  FaFile,
  FaFileAudio,
  FaFileCode,
  FaFileExcel,
  FaFileImage,
  FaFileLines,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
  FaFileZipper,
} from "react-icons/fa6";

export function getFileIcon(mimeType: string) {
  const cls = "h-4 w-4 shrink-0";

  if (mimeType === "application/pdf") return <FaFilePdf className={`${cls} text-red-500`} />;
  if (mimeType.startsWith("image/")) return <FaFileImage className={`${cls} text-green-500`} />;
  if (mimeType.startsWith("video/")) return <FaFileVideo className={`${cls} text-purple-500`} />;
  if (mimeType.startsWith("audio/")) return <FaFileAudio className={`${cls} text-yellow-500`} />;
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return <FaFileWord className={`${cls} text-blue-600`} />;
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return <FaFileExcel className={`${cls} text-green-600`} />;
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return <FaFilePowerpoint className={`${cls} text-orange-500`} />;
  if (mimeType === "text/plain") return <FaFileLines className={`${cls} text-muted-foreground`} />;
  if (mimeType.startsWith("text/") || mimeType === "application/json")
    return <FaFileCode className={`${cls} text-cyan-500`} />;
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/x-tar" ||
    mimeType === "application/x-7z-compressed" ||
    mimeType === "application/x-rar-compressed"
  )
    return <FaFileZipper className={`${cls} text-amber-600`} />;

  return <FaFile className={`${cls} text-muted-foreground`} />;
}
