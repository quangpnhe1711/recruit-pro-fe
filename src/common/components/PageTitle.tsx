import { APP_NAME } from '../constants/app.constants'

type PageTitleProps = {
  title?: string
}

function PageTitle({ title }: PageTitleProps) {
  return <h1>{title ? `${title} | ${APP_NAME}` : APP_NAME}</h1>
}

export default PageTitle
