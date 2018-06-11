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
            Assert.Equal(20, actual.Filter.Rows);
            Assert.Empty(actual.Columns);
        }

        #endregion
    }
}
