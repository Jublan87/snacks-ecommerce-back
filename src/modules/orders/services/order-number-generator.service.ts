import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderNumberGeneratorService {
  generate(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const hhmmss = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const xxx = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `ORD-${yyyy}-${mmdd}-${hhmmss}-${xxx}`;
  }
}
