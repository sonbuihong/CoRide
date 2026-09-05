const mockMessageCreate = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    message: { create: mockMessageCreate },
  },
}));

import { ChatService } from './chat.service';

describe('ChatService.saveMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a message addressed to the sender', async () => {
    await expect(ChatService.saveMessage('ride-1', 'user-1', 'user-1', 'Hello'))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });
});
