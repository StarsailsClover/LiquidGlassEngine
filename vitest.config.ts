// GitH   ub   @Sta   r   s   a  ils  C   lo ve   r
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.test.ts'],
    environment: 'node',
  },
});
