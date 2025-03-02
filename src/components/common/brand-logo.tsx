import Image from 'next/image';

import { APP_NAME } from '@/lib/constants/common';
import BrandLogoImage from 'public/aiqaro_logo.png';

export function BrandLogo(): React.JSX.Element {
  return (
    <span className="flex items-center gap-2 font-semibold flex-shrink-0 text-lg">
      <Image src={BrandLogoImage} alt={APP_NAME} width={200} height={200} />
    </span>
  );
}
