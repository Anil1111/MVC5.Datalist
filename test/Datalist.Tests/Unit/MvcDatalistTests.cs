using NSubstitute;
using Xunit;

namespace Datalist.Tests.Unit
{
    public class MvcDatalistTests
    {
        #region MvcDatalist()

        [Fact]
        public void MvcDatalist_Defaults()
        {
            MvcDatalist actual = Substitute.For<MvcDatalist>();

            Assert.Equal("DatalistDialog", actual.Dialog);
            Assert.Empty(actual.AdditionalFilters);
            Assert.NotNull(actual.Filter);
            Assert.Empty(actual.Columns);
        }

        #endregion
    }
}
